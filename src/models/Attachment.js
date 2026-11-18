import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: String,
    mimetype: String,
    size: Number,
    // Storing data URL string for portability; swap for S3/local disk in prod.
    data: String,
  },
  { timestamps: true },
);

export default mongoose.model("Attachment", schema);
