import { DynamoDBClient, BatchWriteItemCommand, BatchWriteItemCommandInput, WriteRequest } from '@aws-sdk/client-dynamodb';
import type { createBillsRequestBodyType, PendingPaymentSchemaType } from '../../utils/validator';
import type { APIGatewayProxyEventV2 } from '@aws-lambda-powertools/parser/types';
import type { LambdaInterface, } from '@aws-lambda-powertools/commons/types';
import { createBillsRequestBodySchema } from '../../utils/validator';
import type { ParsedResult } from '@aws-lambda-powertools/parser/types';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { parser } from '@aws-lambda-powertools/parser';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Response } from '../../utils/types';
import { R } from '../../utils/transform';
import type { Context } from 'aws-lambda';
import { env } from 'node:process';


/**
 * @description
 *
 */
class Lambda implements LambdaInterface {

	private client: DynamoDBClient;
	private documentClient: DynamoDBDocumentClient;
	constructor() {
		this.client = new DynamoDBClient({ region: env.REGION });
		this.documentClient = DynamoDBDocumentClient.from(this.client);
	}

	/**
	 * @description
	 * @param pendingPayments
	 * @returns
	 */
	public async create(pendingPayments: Array<WriteRequest>) {
		try {
			const input: BatchWriteItemCommandInput = {
				RequestItems: {
					[env.PAYMENTS_TABLE_NAME as string]: pendingPayments,
				},
				ReturnItemCollectionMetrics: 'SIZE',
				ReturnConsumedCapacity: 'TOTAL'
			};

			return await this.documentClient.send(new BatchWriteItemCommand(input));

		} catch (error: any) {
			console.error(error);
			throw error;
		}
	}

	private generateNPE(data: PendingPaymentSchemaType): string {

		let date = new Date(data.ExpirationDate * 1000);
		let $ = {
			ExpirationDate: {
				year: date.getFullYear().toString(),
				month: (date.getMonth() + 1).toString().padStart(2, '0'),
				day: date.getDate().toString().padStart(2, '0'),
			},
			ExtendedProperties: {
				...data.ExtendedProperties
			}
		};
		const templates: { [Key: string]: string } = {
			'ff339fa': `${$.ExpirationDate.year}${$.ExpirationDate.month}${$.ExpirationDate.day}${$.ExtendedProperties.UserContract}`,
			'basic': ``,
		};


		let template = templates[data?.TemplateCode];

		if (!template) {
      		throw new Error(`Template '${data?.TemplateCode}' not found`);
    	}
		return template;
	}


	/**
	 * @description
	 * @param data
	 * @returns
	 */
	public reMapIncoming(data: Array<PendingPaymentSchemaType>): Array<WriteRequest> {
		return data.map(p => ({
			PutRequest: {
				ConditionExpression: 'attribute_not_exists(npe)',
				Item: marshall({
					npe: this.generateNPE(p),
					AmountToPay: p.AmountToPay,
					ServiceProvider: p.ServiceProvider,
					TemplateCode: p.TemplateCode,
					CanExpire: p.CanExpire,
					ExpirationDate: p.ExpirationDate,
					ExtendedProperties: p.ExtendedProperties,
					PaymentStatus: false,
					UpdatedDate: 0,
					CreationDate: String(Math.floor(new Date().getTime() / 1000)),
				}),
			}
    	}));
	}


	@parser({ schema: createBillsRequestBodySchema, safeParse: true })
	public async handler(event: ParsedResult<APIGatewayProxyEventV2, createBillsRequestBodyType>, _context: Context): Promise<Response> {
		try {
			if (event.success) {

				const pendingPayments = this.reMapIncoming(event.data.body.pendingPayments);

				if (pendingPayments.length > 0) {
					const { UnprocessedItems } = await this.create(pendingPayments);

					const elements = Object.keys(UnprocessedItems ?? {}).length;
					if (elements === 0) {
						return R(200, { message: 'Partial Success', UnprocessedItems });
					} else {
						return R(200, { message: 'Success', UnprocessedItems });
					}
				} else {
					return R(400, {
						message: 'Invalid number',
						error: '',
						cause: '',
					});
				}

			} else {
				return R(400, {
					message: 'Wrong input data',
					error: event.error ?? '',
					cause: event.error.cause ?? '',
				});
			}

		} catch (error: any) {
			return R(500, { message: 'Server Error' });
		}
	}
}


const λ = new Lambda();

export const handler = λ.handler.bind(λ);
