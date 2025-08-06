import {
	DynamoDBClient,
	QueryCommand,
	QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { env } from 'node:process';
import { Response } from '../../utils/types';
import { NPERequestValidator } from '../../utils/validator';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { R } from '../../utils/transform';

const client = new DynamoDBClient({ region: env.REGION });

export const handler = async (event: APIGatewayProxyEventV2): Promise<Response> => {
	try {
		/**
		 * @description
		 * Check if the request body is present
		 */
		if (!event.body) return R(400, { message: 'invalid request,' });

		/**
		 * @description
		 * Parse the incoming request body
		 */
		const result = NPERequestValidator.safeParse(
			JSON.parse(event?.body ?? '{}')
		);

		if (result.error) return R(400, { message: result.error.flatten() });

		/**
		 *
		 */
		const params: QueryCommandInput = {
			TableName: env.PAYMENTS_TABLE_NAME,
			KeyConditionExpression: 'npe = :npe',
			ExpressionAttributeValues: {
				':npe': {
					S: result.data?.npe ?? '',
				},
			},
		};

		const { Items, Count } = await client.send(new QueryCommand(params));

		if (Count ?? 0 > 0) {
			const plainItems = (Items ?? []).map(item => unmarshall(item));
			return R(200, plainItems);
		} else {
			return R(404, { message: 'Element not found' });
		}
	} catch (error: any) {
		console.error(error);

		return R(500, { message: 'Server Error' });
	}
};
