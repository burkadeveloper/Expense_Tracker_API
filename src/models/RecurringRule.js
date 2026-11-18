import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    followEthiopianMonth: { type: Boolean, default: false },
    template: {
      type: {
        type: String,
        enum: ["income", "expense", "transfer"],
        required: true,
      },
      amountMinor: { type: Number, required: true },
      fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
      toAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
      category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      payee: String,
      notes: String,
      paymentMethod: { type: String, default: "cash" },
    },
    startDate: { type: Date, required: true },
    nextRunAt: { type: Date, required: true },
    lastRunAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("RecurringRule", schema);
