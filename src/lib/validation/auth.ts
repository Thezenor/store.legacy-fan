import { z } from 'zod';

// Validaciones de auth (doc 03: datos mínimos de registro).
// Mensajes en clave i18n-friendly; la UI traduce por código.

const email = z.string().trim().toLowerCase().email();
const password = z
  .string()
  .min(8, 'password_min')
  .max(100)
  .regex(/[a-z]/, 'password_weak')
  .regex(/[A-Z]/, 'password_weak')
  .regex(/[0-9]/, 'password_weak');

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    country: z.string().trim().length(2), // ISO-3166 alpha-2
    email,
    password,
    confirmPassword: z.string(),
    currency: z.enum(['EUR', 'USD']),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'terms_required' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'password_mismatch',
    path: ['confirmPassword'],
  });

// Registro simplificado dentro del checkout (sin repetir contraseña): datos básicos.
export const checkoutRegisterSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  country: z.string().trim().length(2),
  email,
  password,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'terms_required' }) }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'password_mismatch',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
