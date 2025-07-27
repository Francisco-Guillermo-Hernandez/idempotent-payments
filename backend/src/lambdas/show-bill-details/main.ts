import {
	DynamoDBClient,
	QueryCommand,
	QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { env } from 'node:process';
import { Response } from '../../utils/types';
import { NPERequestValidator } from '../../utils/validator';
import type { APIGatewayProxyEventV2, } from 'aws-lambda'
import { ZodError } from 'zod';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { R } from '../../utils/transform'


const client = new DynamoDBClient({ region: env.REGION });

export const handler = async (event: APIGatewayProxyEventV2): Promise<Response> => {

	try {

		if (!event.body) {
			return { statusCode: 400, message: 'invalid request, ' };
		}

		/**
		 *
		 */
		const result =  NPERequestValidator.safeParse(JSON.parse(event?.body ?? '{}'));

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

		if (error.cause instanceof ZodError) {
			return R(400, { message: error.cause.flatten()});
		}

		return R(500, { message: 'Server Error', });
	}
};
