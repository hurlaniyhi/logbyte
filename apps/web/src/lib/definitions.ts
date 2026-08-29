import * as z from "zod";

export const SignupFormSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { message: "Password must contain a letter." })
    .regex(/[0-9]/, { message: "Password must contain a number." }),
});

export const LoginFormSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
