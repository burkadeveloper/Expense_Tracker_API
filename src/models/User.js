import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    password: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, sparse: true, unique: true },
    googleId: { type: String, sparse: true },
    avatar: { type: String, default: null }, // data URL or URL string
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    locale: { type: String, enum: ["en", "am", "om", "ti"], default: "en" },
    calendar: {
      type: String,
      enum: ["gregorian", "ethiopian"],
      default: "ethiopian",
    },
    currency: { type: String, default: "ETB" },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    dataSaver: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: false },
    consentAcceptedAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.methods.toSafe = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    locale: this.locale,
    calendar: this.calendar,
    currency: this.currency,
    theme: this.theme,
    dataSaver: this.dataSaver,
    onboarded: this.onboarded,
    emailVerified: this.emailVerified,
    phoneVerified: this.phoneVerified,
  };
};

export default mongoose.model("User", userSchema);
