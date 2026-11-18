import mongoose from "mongoose";

const splitSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    amountMinor: { type: Number, required: true },
    note: String,
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    amountMinor: { type: Number, required: true }, // total amount in santim
    currency: { type: String, default: "ETB" },
    // For cross-currency transfers, allow per-leg amount
    fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    toAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    fromAmountMinor: { type: Number },
    toAmountMinor: { type: Number },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    splits: { type: [splitSchema], default: [] },
    date: { type: Date, required: true, index: true },
    payee: String,
    notes: String,
    tags: { type: [String], default: [] },
    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "bank_transfer",
        "telebirr",
        "cbe_birr",
        "mpesa",
        "card",
        "other",
      ],
      default: "cash",
    },
    // Ethiopian tax fields
    vatApplied: { type: Boolean, default: false },
    totApplied: { type: Boolean, default: false },
    // Custom exchange rate for diaspora/imported transactions
    exchangeRate: Number,
    attachmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
    idempotencyKey: { type: String, index: true, sparse: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ user: 1, date: -1 });
schema.index({ user: 1, deletedAt: 1, date: -1 });
schema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model("Transaction", schema);
