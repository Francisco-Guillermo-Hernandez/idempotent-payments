import { DynamoDBClient, UpdateItemCommandInput, UpdateItemCommand, GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { creditCardRequestBodySchema, type CreditCardRequestBodyType } from '../../utils/validator';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { IdempotencyConfig, idempotent } from '@aws-lambda-powertools/idempotency';
import type { APIGatewayProxyEventV2 } from '@aws-lambda-powertools/parser/types';
import type { LambdaInterface, } from '@aws-lambda-powertools/commons/types';
import type { ParsedResult } from '@aws-lambda-powertools/parser/types';
import { parser } from '@aws-lambda-powertools/parser';
import type { Response } from '../../utils/types';
import type { Context } from 'aws-lambda';
import { R } from '../../utils/transform';
import { randomUUID } from 'node:crypto';
import { env } from 'node:process';

type CreditCard = {
  cvv: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
};

const config = new IdempotencyConfig({
    expiresAfterSeconds: (5 * 60),
}),
persistenceStore = new DynamoDBPersistenceLayer({
    clientConfig: { region: env.REGION },
    tableName: env.IDEMPOTENCY_TABLE_NAME,
});

class Lambda implements LambdaInterface {

    @idempotent({ config: config, persistenceStore })
    public async savePayment(cc: CreditCard & { amount: number }) {
        const client = new DynamoDBClient({ region: env.REGION });

        try {
            // We are going to check if card exists in the database
            const getParams: GetItemCommandInput = {
                TableName: env.PAYMENTS_TABLE_NAME,
                Key: {
                    CardNumber: { S: cc.cardNumber },
                }
            };

            const getResult = await client.send(new GetItemCommand(getParams));

            if (!getResult.Item) {
                throw new Error('Card not found');
            }


			if (!getResult.Item.IsActive?.B) {
				throw new Error(`Credit card isn't active`);
			}

            if (getResult.Item.CVV?.S !== cc.cvv) {
                throw new Error('Invalid CVV');
            }

            // Parse current balance
            const currentBalance = Number(getResult.Item.Balance?.N || '0');

            if (currentBalance < cc.amount) {
                throw new Error('Insufficient funds');
            }

            const newBalance = currentBalance - cc.amount;

            const params: UpdateItemCommandInput = {
                TableName: env.PAYMENTS_TABLE_NAME,
                Key: {
                    cardNumber: { S: cc.cardNumber },
                },
                ExpressionAttributeNames: {
                    '#UD': 'UpdatedDate',
                    '#B': 'Balance',
					'#IA': 'IsActive'
                },
                UpdateExpression: 'SET #UD = :date, #B = :newBalance',
                ConditionExpression: 'attribute_exists(cardNumber) AND #B >= :amount',
                ExpressionAttributeValues: {
                    ':amount': { N: String(cc.amount) },
                    ':newBalance': { N: String(newBalance) },
                    ':date': { N: String(Math.floor(new Date().getTime() / 1000)) },
                    ':active': { BOOL: true },
                },
                ReturnValues: 'ALL_NEW'
            };

            const { Attributes } = await client.send(new UpdateItemCommand(params));

            return {
                paymentId: randomUUID(),
                data: Attributes,
                balance: newBalance
            };
        } catch (error: any) {
            console.error(error);
            throw error;
        }
    }

    @parser({ schema: creditCardRequestBodySchema, safeParse: true })
    public async handler(event: ParsedResult<APIGatewayProxyEventV2, CreditCardRequestBodyType>, context: Context): Promise<Response> {

        try {

            config.registerLambdaContext(context);

            if (event.success) {

                const result = await this.savePayment(event.data.body);

                return R(200, {
                    message: 'Success',
                    paymentId: result.paymentId,
                    balance: result.balance
                });
            } else {
                return R(400, {
                    message: 'Wrong input data',
                    error: event.error ?? '',
                    cause: event.error.cause ?? '',
                });
            }
        } catch (error: any) {
            console.error(error);
            console.error(error.cause);

            if (error.message === 'Insufficient funds') {
                return R(402, { message: 'Payment declined - insufficient funds' });
            } else if (error.message === 'Card not found') {
                return R(404, { message: 'Card not found' });
            } else if (error.cause === 'ConditionalCheckFailedException') {
                return R(412, { message: 'Precondition Failed' });
            } else {
                return R(500, { message: 'Server Error' });
            }
        }
    }
}

const λ = new Lambda();
export const handler = λ.handler.bind(λ);
