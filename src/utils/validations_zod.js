import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(1, { message: "First name is required" }),
  email: z.string().email({ message: "enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});
