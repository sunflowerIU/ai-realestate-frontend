import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.email("Enter a valid email address.").max(320),
  phone: z.string().trim().max(30),
  message: z.string().trim().min(10, "Tell us a little about your work.").max(1500),
});
