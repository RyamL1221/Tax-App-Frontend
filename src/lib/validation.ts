/**
 * Validation schemas and utilities for authentication
 */

import { z } from 'zod';

/**
 * Zod schema for login form validation
 * Validates email format and password length requirements
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

/**
 * Type inference from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address using the Zod schema
 * @param email - The email address to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  const emailSchema = z.string().min(1, "Email is required").email("Please enter a valid email address");
  
  const result = emailSchema.safeParse(email);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error?.issues?.[0]?.message || "Invalid email",
  };
}

/**
 * Validates a password using the Zod schema
 * @param password - The password to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validatePassword(password: string): ValidationResult {
  const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long");
  
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error?.issues?.[0]?.message || "Invalid password",
  };
}

/**
 * Error message mapping for common validation errors
 */
export const validationErrorMessages = {
  email: {
    required: "Email is required",
    invalid: "Please enter a valid email address",
  },
  password: {
    required: "Password is required",
    minLength: "Password must be at least 8 characters",
    maxLength: "Password is too long",
  },
  general: {
    required: "This field is required",
  },
} as const;

/**
 * Maps Zod error messages to user-friendly messages
 * @param field - The field name (email or password)
 * @param zodError - The Zod error message
 * @returns User-friendly error message
 */
export function mapValidationError(field: 'email' | 'password', zodError: string): string {
  if (field === 'email') {
    if (zodError.includes('required') || zodError.includes('at least 1')) return validationErrorMessages.email.required;
    if (zodError.includes('email') || zodError.includes('Invalid')) return validationErrorMessages.email.invalid;
  }
  
  if (field === 'password') {
    if (zodError.includes('at least 8')) return validationErrorMessages.password.minLength;
    if (zodError.includes('too long')) return validationErrorMessages.password.maxLength;
    if (zodError.includes('required') || zodError.includes('at least 1')) return validationErrorMessages.password.required;
  }
  
  return zodError;
}
