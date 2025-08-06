import { z } from 'zod';

import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';

/**
 *
 */
export const NPERequestValidator = z.object({
	npe: z.string().min(12, '').max(40, '').regex(/^\d+$/),
});


export const extendedSchema = APIGatewayProxyEventV2Schema.extend({
	body: JSONStringified(NPERequestValidator),
});

export type NPERequestValidatorEvent = z.infer<typeof extendedSchema>;



const genericRequestSchemaParser = <T extends z.ZodTypeAny>(validator: T) => {
	return APIGatewayProxyEventV2Schema.extend({
		body: z.string().transform(body => {
			try {
				return JSON.parse(body);
			} catch (error: any) {
				throw new Error(error);
			}
		}).pipe(validator),
	});
};


export const payBillsRequestBodySchema = genericRequestSchemaParser(NPERequestValidator);

export type payBillsRequestBodyType = z.infer<typeof payBillsRequestBodySchema>;