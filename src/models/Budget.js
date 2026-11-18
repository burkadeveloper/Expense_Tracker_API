import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    }, // null = overall
    amountMinor: { type: Number, required: true },
    period: { type: String, enum: ["monthly"], default: "monthly" },
    calendar: {
      type: String,
      enum: ["gregorian", "ethiopian"],
      default: "ethiopian",
    },
    year: Number,
    month: Number,
    rollover: { type: Boolean, default: false },
    alert80: { type: Boolean, default: true },
    alert100: { type: Boolean, default: true },
  },
  { timestamps: true },
);

schema.index(
  { user: 1, calendar: 1, year: 1, month: 1, category: 1 },
  { unique: true, partialFilterExpression: { category: { $ne: null } } },
);
export default mongoose.model("Budget", schema);
