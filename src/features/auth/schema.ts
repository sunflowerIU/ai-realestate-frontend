import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  password: z.string().min(1, "Enter your password.").max(128),
});
