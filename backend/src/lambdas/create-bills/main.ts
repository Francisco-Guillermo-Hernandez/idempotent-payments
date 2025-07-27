import {
	DynamoDBClient,
	PutItemCommand,
	PutItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { env } from 'node:process';
import { Response } from '../../utils/types';
import { R } from '../../utils/transform'

const client = new DynamoDBClient({ region: env.REGION });

/**
 *
 */
export const handler = async (): Promise<Response> => {
	try {

		const npe = '0000 0000 0000 0000 0000 0000 0000 0000';

		const item = {
			amount: 0.0,
			provider: '',
			npe: npe,
		};

		const params: PutItemCommandInput = {
			TableName: env.PAYMENTS_TABLE_NAME,
			Item: marshall(item),
		};

		await client.send(new PutItemCommand(params));

		return R(200, { message: 'CREATED', npe });

	} catch (error: any) {
		console.error(error);
		return R(500, { message: 'Server Error', });
	}
};
