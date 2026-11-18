import { z } from "zod";

export const createBudgetSchema = z.object({
  body: z.object({
    category: z.string().nullable().optional(),
    amountMinor: z.number().int().positive(),
    calendar: z.enum(["gregorian", "ethiopian"]).default("ethiopian"),
    year: z.number().int(),
    month: z.number().int().min(1).max(13),
    rollover: z.boolean().optional(),
    alert80: z.boolean().optional(),
    alert100: z.boolean().optional(),
  }),
});
