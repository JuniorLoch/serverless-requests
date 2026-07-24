import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

export async function validateDto<T extends object>(dtoClass: new () => T, data: unknown): Promise<{ isValid: boolean; errors?: Record<string, string[]>; instance?: T }> {
  const instance = plainToInstance(dtoClass, data);
  const errors: ValidationError[] = await validate(instance as object, { whitelist: true, forbidNonWhitelisted: false });

  if (errors.length > 0) {
    const formattedErrors: Record<string, string[]> = {};
    errors.forEach((error) => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
    });
    return { isValid: false, errors: formattedErrors };
  }

  return { isValid: true, instance };
}

export function sendValidationError(res: Response, errors: Record<string, string[]>) {
  res.status(400).json({
    error: 'Validation failed',
    details: errors,
  });
}
