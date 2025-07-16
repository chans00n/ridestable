import { z } from 'zod'

// Password validation regex: at least 8 chars, 1 uppercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Phone validation regex: supports international formats
const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>
export type ResetPasswordRequestDto = z.infer<typeof ResetPasswordRequestSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>

export interface AuthResponse {
  user: UserDto
  accessToken: string
  refreshToken: string
}

export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}