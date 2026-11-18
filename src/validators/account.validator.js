import { z } from "zod";

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    type: z.enum([
      "cash",
      "bank",
      "mobile_money",
      "credit_card",
      "savings",
      "investment",
      "equb",
      "iddir",
      "loan",
    ]),
    provider: z.string().optional().nullable(),
    currency: z.string().length(3).default("ETB"),
    openingBalanceMinor: z.number().int().default(0),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({ id: z.string() }),
  body: createAccountSchema.shape.body.partial(),
});

export const transferSchema = z.object({
  body: z.object({
    fromAccount: z.string(),
    toAccount: z.string(),
    fromAmountMinor: z.number().int().positive(),
    toAmountMinor: z.number().int().positive().optional(),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});
