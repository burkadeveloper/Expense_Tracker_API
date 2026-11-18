import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["owed_by_me", "owed_to_me"],
      required: true,
    },
    counterparty: { type: String, required: true },
    principalMinor: { type: Number, required: true },
    remainingMinor: { type: Number, required: true },
    dueDate: Date,
    notes: String,
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Debt", schema);
