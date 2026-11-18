import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    base: { type: String, required: true },
    quote: { type: String, required: true },
    rate: { type: Number, required: true },
    source: { type: String, enum: ["manual", "provider"], default: "manual" },
    effectiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

schema.index({ base: 1, quote: 1, effectiveAt: -1 });
export default mongoose.model("ExchangeRate", schema);
