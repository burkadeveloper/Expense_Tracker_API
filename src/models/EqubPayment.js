import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    equb: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equb",
      required: true,
      index: true,
    },
    amountMinor: { type: Number, required: true },
    date: { type: Date, required: true },
    round: Number,
    notes: String,
  },
  { timestamps: true },
);

export default mongoose.model("EqubPayment", schema);
