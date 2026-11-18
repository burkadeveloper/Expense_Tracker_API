import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    key: { type: String, required: true },
    kind: { type: String, enum: ["income", "expense"], required: true },
    icon: String,
    color: String,
    name: {
      en: { type: String, required: true },
      am: { type: String },
      om: { type: String },
      ti: { type: String },
    },
    isDefault: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ user: 1, kind: 1 });
schema.index({ user: 1, key: 1 }, { unique: true, sparse: true });
export default mongoose.model("Category", schema);
