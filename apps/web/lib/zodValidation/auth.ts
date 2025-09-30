import { z } from "zod";

export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Enter a valid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be at most 128 characters" }),
});

export const SignupSchema = CredentialsSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name is too long" }),
});

export type CredentialsInput = z.infer<typeof CredentialsSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

