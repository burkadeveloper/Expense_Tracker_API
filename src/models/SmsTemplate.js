import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    providerKey: { type: String, required: true, unique: true, trim: true },
    providerName: { type: String, required: true },
    // Array of regex-based patterns. Each has fields captured by named groups.
    patterns: [
      {
        regex: { type: String, required: true },
        type: {
          type: String,
          enum: ["expense", "income", "airtime", "bill", "unknown"],
          default: "unknown",
        },
        // Named group defaults when absent from regex
        defaults: {
          paymentMethod: String,
        },
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("SmsTemplate", schema);
