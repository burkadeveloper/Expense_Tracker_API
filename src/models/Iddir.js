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
    monthlyContributionMinor: { type: Number, required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    payments: [
      {
        amountMinor: Number,
        date: Date,
        note: String,
      },
    ],
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Iddir", schema);
