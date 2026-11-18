import { z } from "zod";

const phoneRe = /^\+251[79]\d{8}$/;

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    consent: z.literal(true),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const phoneRequestOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(phoneRe, "Use E.164 +251…"),
    purpose: z.enum(["login", "reset"]).default("login"),
  }),
});

export const phoneVerifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(phoneRe),
    code: z.string().length(6),
    purpose: z.enum(["login", "reset"]).default("login"),
  }),
});
