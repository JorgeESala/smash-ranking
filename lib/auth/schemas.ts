// Zod schemas for auth forms. Single source of truth — server actions and
// client components both import from here.
import { z } from "zod";

// Supabase's bcrypt limit is 72 bytes; we cap password length accordingly.
export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const signInSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const signUpSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(2, "Mínimo 2 caracteres")
      .max(24, "Máximo 24 caracteres"),
    email: z.string().email("Correo inválido"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    code: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const resetRequestSchema = z.object({
  email: z.string().email("Correo inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
