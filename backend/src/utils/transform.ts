import { Response, Headers } from './types'

export const R = (statusCode: number, body: any = {}, headers?: Headers): Response => ({
	statusCode: statusCode,
	body: JSON.stringify(body),
	headers: headers,
});