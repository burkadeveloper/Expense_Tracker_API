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
    contributionMinor: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "monthly",
    },
    members: { type: Number, required: true },
    startDate: Date,
    payoutRound: Number,
    payoutDate: Date,
    receivedPayout: { type: Boolean, default: false },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Equb", schema);
