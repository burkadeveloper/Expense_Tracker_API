import { z } from "zod";

const splitSchema = z.object({
  category: z.string(),
  amountMinor: z.number().int().positive(),
  note: z.string().optional(),
});

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(["income", "expense", "transfer"]),
    amountMinor: z.number().int().positive(),
    currency: z.string().length(3).default("ETB"),
    fromAccount: z.string().optional(),
    toAccount: z.string().optional(),
    fromAmountMinor: z.number().int().positive().optional(),
    toAmountMinor: z.number().int().positive().optional(),
    category: z.string().optional(),
    splits: z.array(splitSchema).optional(),
    date: z.string().datetime(),
    payee: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    paymentMethod: z
      .enum([
        "cash",
        "bank_transfer",
        "telebirr",
        "cbe_birr",
        "mpesa",
        "card",
        "other",
      ])
      .default("cash"),
    vatApplied: z.boolean().optional(),
    totApplied: z.boolean().optional(),
    exchangeRate: z.number().positive().optional(),
    idempotencyKey: z.string().optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: createTransactionSchema.shape.body.partial(),
});

export const listTransactionSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(["income", "expense", "transfer"]).optional(),
    account: z.string().optional(),
    category: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    q: z.string().optional(),
  }),
});
