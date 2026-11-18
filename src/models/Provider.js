import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    kind: {
      type: String,
      enum: ["bank", "mobile_money", "card", "other"],
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Provider", schema);
