import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: { type: String, required: true },
    title: String,
    body: String,
    readAt: { type: Date, default: null },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export default mongoose.model("Notification", schema);
