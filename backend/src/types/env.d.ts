export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ENV: string;
			PAYMENTS_TABLE_NAME: string;
			IDEMPOTENCY_TABLE_NAME: string;
			REGION: string;
		}
	}
}
