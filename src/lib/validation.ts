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
