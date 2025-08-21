import { IdempotencyConfig, idempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { parser } from '@aws-lambda-powertools/parser';
import type { LambdaInterface, } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import type { payBillsRequestBodyType } from '../../utils/validator';
import { payBillsRequestBodySchema } from '../../utils/validator';
import type { Response } from '../../utils/types';
import { R } from '../../utils/transform';
import { randomUUID } from 'node:crypto';
import { env } from 'node:process';
import { DynamoDBClient, UpdateItemCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { ParsedResult } from '@aws-lambda-powertools/parser/types';
import type { APIGatewayProxyEventV2 } from '@aws-lambda-powertools/parser/types';


const config = new IdempotencyConfig({
		expiresAfterSeconds: (5 * 60),
	}),
	persistenceStore = new DynamoDBPersistenceLayer({
		clientConfig: { region: env.REGION },
		tableName: env.IDEMPOTENCY_TABLE_NAME,

	}),
	_logger = new Logger(),
 	_tracer = new Tracer({ serviceName: 'serverlessAirline' }),
	_metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'pay-bills'});

/**
 *
 */
class Lambda implements LambdaInterface {

	@idempotent({ config: config, persistenceStore })
    public async savePayment(npe: string) {
		const client = new DynamoDBClient({ region: env.REGION });

		//https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
		//https://docs.powertools.aws.dev/lambda/typescript/latest/features/idempotency/#lambda-timeouts

		try {
			const params: UpdateItemCommandInput = {
				TableName: env.PAYMENTS_TABLE_NAME,
				Key: {
					NPE: { S: npe },
				},
				ExpressionAttributeNames: {
					'#PS': 'HasBeenPaid',
					'#UD': 'UpdatedDate',
				},
				UpdateExpression: 'SET #PS = :status, #UD = :date',
				ConditionExpression: 'attribute_exists(NPE) AND #PS = :defaultStatus',
				ExpressionAttributeValues: {
					':status': { BOOL: true },
					':date': { N: String(Math.floor(new Date().getTime() / 1000)), },
					':defaultStatus': { BOOL: false },
				},
				ReturnValues: 'ALL_NEW'
			};

			const { Attributes } = await client.send(new UpdateItemCommand(params));
			return {
				paymentId: randomUUID(),
				data: Attributes,
			};
		} catch (error: any) {
			console.error(error);

			if (error.name === 'ConditionalCheckFailedException') {
				throw new Error('ConditionExpression', { cause: 'ConditionalCheckFailedException' });
			} else {
				throw new Error(error);
			}
		}
	}


	// @logger.injectLambdaContext()
    // @metrics.logMetrics()
    // @tracer.captureLambdaHandler()
	@parser({ schema: payBillsRequestBodySchema, safeParse: true })
	public async handler(event: ParsedResult<APIGatewayProxyEventV2, payBillsRequestBodyType>, context: Context): Promise<Response> {

		try {
			//tracer.getSegment();
			config.registerLambdaContext(context);

			if (event.success) {

				const { paymentId } = await this.savePayment(event.data.body.npe);
				return R(200, { message: 'Success', paymentId });
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

			if (error.cause === 'ConditionalCheckFailedException') {
				return R(412, { message: 'Precondition Failed' });
        	} else {
				return R(500, { message: 'Server Error' });
			}
		}
	}
}

const λ = new Lambda();

/**
 * @description Binding your handler method allows your handler to access this.
 */
export const handler = λ.handler.bind(λ);

