import mongoose from "mongoose";

const TYPES = [
  "cash",
  "bank",
  "mobile_money",
  "credit_card",
  "savings",
  "investment",
  "equb",
  "iddir",
  "loan",
];

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TYPES, required: true },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    currency: { type: String, default: "ETB" },
    balanceMinor: { type: Number, default: 0 }, // santim
    openingBalanceMinor: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ user: 1, archivedAt: 1 });
export default mongoose.model("Account", schema);
