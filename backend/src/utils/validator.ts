import { z } from 'zod';

import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';

/**
 *
 */
export const NPERequestValidator = z.object({
	npe: z.string().min(12, '').max(40, '').regex(/^\d+$/),
});

/**
 * @description Main validator for Create Bills Lambda
 */
const PendingPaymentSchema = z.object({
	AmountToPay: z.number(),
	ServiceProvider: z.number(),
	TemplateCode: z.string(),
	CanExpire: z.boolean(),
	ExpirationDate: z.number(),
	ExtendedProperties: z.object({
		UserContract: z.string(),
	}),
});

/**
 * @description Part of the validator
 */
export const CreateBillRequestValidatorSchema = z.object({
	pendingPayments: z.array(PendingPaymentSchema).min(1, 'Please Send more elements'),
});

/**
 *
 */
export const extendedSchema = APIGatewayProxyEventV2Schema.extend({
	body: JSONStringified(NPERequestValidator),
});

export type NPERequestValidatorEvent = z.infer<typeof extendedSchema>;


/**
 * @description Request parser to provide decoded and typed data
 * for the incoming event in the handler when is used @parser({ schema, safeParse: true }) decorator.
 * @param validator
 * @returns
 */
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


/**
 * @description
 */
export const payBillsRequestBodySchema = genericRequestSchemaParser(NPERequestValidator);

/**
 * @description
 */
export type payBillsRequestBodyType = z.infer<typeof payBillsRequestBodySchema>;

/**
 * @description Schemas for crete bills Lambda
 */
export const createBillsRequestBodySchema = genericRequestSchemaParser(CreateBillRequestValidatorSchema);

/**
 * @description Types for create bills Lambda
 */
export type createBillsRequestBodyType = z.infer<typeof createBillsRequestBodySchema>;
export type PendingPaymentSchemaType = z.infer<typeof PendingPaymentSchema>;
