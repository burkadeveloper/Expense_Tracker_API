import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    debt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debt",
      required: true,
      index: true,
    },
    amountMinor: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: String,
  },
  { timestamps: true },
);

export default mongoose.model("DebtPayment", schema);
