import { AbstractControl, ValidationErrors } from '@angular/forms';
import { z } from 'zod';

/**
 * @description
 * @param schema
 * @returns
 */
export function zodValidator(schema: z.ZodType<any, any>) {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = schema.safeParse(control.value);
    return result.success ? null : { zodError: result.error.issues[0].message };
  };
}
