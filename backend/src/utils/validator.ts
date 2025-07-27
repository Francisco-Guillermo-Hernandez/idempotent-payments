import { z } from 'zod';

export const NPERequestValidator = z.object({
	npe: z.string().min(12, '').max(40, '').regex(/\d/),
});
