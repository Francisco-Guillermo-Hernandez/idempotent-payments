import {
	IdempotencyConfig,
	makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import {
	DynamoDBClient,
	UpdateItemCommand,
	UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';

import { randomUUID } from 'node:crypto';
// import type { Context } from 'aws-lambda';
import type { Request, Response, SubscriptionResult } from '../../utils/types';
import { NPERequestValidator } from '../../utils/validator';
import { R } from '../../utils/transform'
import { env } from 'node:process';

const config = new IdempotencyConfig({
		eventKeyJmesPath: 'powertools_json(body).["npe"]',
	}),
	persistenceStore = new DynamoDBPersistenceLayer({
		clientConfig: { region: env.REGION },
		tableName: env.PAYMENTS_TABLE_NAME,
	}),
	triggerPayment = async (npe: string): Promise<SubscriptionResult> => {
		console.info(npe);

		const client = new DynamoDBClient({ region: env.REGION });

		try {
			const params: UpdateItemCommandInput = {
				TableName: env.PAYMENTS_TABLE_NAME,
				Key: {
					PartitionKey: { S: 'npe' },
				},
				ExpressionAttributeNames: {
					'#PS': 'PaymentStatus',
					'#UD': 'UpdatedDate',
				},
				UpdateExpression: 'SET #PS = :status, #UD = :date',
				ExpressionAttributeValues: {
					':status': { BOOL: true },
					':date': {
						N: String(Math.floor(new Date().getTime() / 1000)),
					},
				},
			};

			await client.send(new UpdateItemCommand(params));
			return {
				id: randomUUID(),
			};
		} catch (error: any) {
			console.error(error);

			return {
				id: '',
			};
		}
	};

export const handler = makeIdempotent(
	async (request: Request): Promise<Response> => {
		try {
			const result = NPERequestValidator.parse(request);
			const payment = await triggerPayment(result.npe);

			return R(200, { message: 'Success', paymentId: payment.id,});
		} catch (error: any) {
			console.error(error);
			return R(500, { message: 'Server Error', });
		}
	},
	{
		persistenceStore,
		config,
	}
);
