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
    targetMinor: { type: Number, required: true },
    savedMinor: { type: Number, default: 0 },
    deadline: Date,
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Goal", schema);
