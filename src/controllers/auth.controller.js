import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import User from "../models/User.js";
import OtpCode from "../models/OtpCode.js";
import EmailVerificationToken from "../models/EmailVerificationToken.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  signAccess,
  issueRefresh,
  rotateRefresh,
  setRefreshCookie,
  clearRefreshCookie,
  revokeAll,
  revokeOne,
} from "../services/token.service.js";
import { sendOtp } from "../services/sms/index.js";
import { sendVerificationEmail } from "../services/email/index.js";
import env from "../config/env.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

function normalizePhone(phone) {
  const digits = String(phone).replace(/[^\d+]/g, "");
  if (digits.startsWith("+251")) return digits;
  if (digits.startsWith("251")) return "+" + digits;
  if (digits.startsWith("0")) return "+251" + digits.slice(1);
  if (digits.length === 9) return "+251" + digits;
  return digits;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, consent } = req.validated.body;
  if (!consent) throw ApiError.badRequest("Consent required");
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict("Email already registered");
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    consentAcceptedAt: new Date(),
  });
  const access = signAccess(user);
  const refresh = await issueRefresh(user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, refresh.raw);
  ok(res, { user: user.toSafe(), accessToken: access }, "Registered", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({
    email: email.toLowerCase(),
    deletedAt: null,
  }).select("+password");
  if (!user || !user.password)
    throw ApiError.unauthorized("Invalid credentials");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized("Invalid credentials");
  const access = signAccess(user);
  const refresh = await issueRefresh(user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, refresh.raw);
  ok(res, { user: user.toSafe(), accessToken: access }, "Logged in");
});

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.rt;
  if (!raw) throw ApiError.unauthorized("No refresh token");
  const result = await rotateRefresh(raw, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  if (!result) throw ApiError.unauthorized("Invalid refresh token");
  setRefreshCookie(res, result.refresh.raw);
  ok(
    res,
    { user: result.user.toSafe(), accessToken: signAccess(result.user) },
    "Refreshed",
  );
});

export const logout = asyncHandler(async (req, res) => {
  if (req.cookies?.rt) await revokeOne(req.cookies.rt);
  clearRefreshCookie(res);
  ok(res, null, "Logged out");
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAll(req.user._id);
  clearRefreshCookie(res);
  ok(res, null, "Logged out everywhere");
});

export const me = asyncHandler(async (req, res) => {
  ok(res, { user: req.user.toSafe() });
});

// ===== Phone OTP =====
export const requestOtp = asyncHandler(async (req, res) => {
  const { phone, purpose } = req.validated.body;
  const normalized = normalizePhone(phone);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  await OtpCode.create({
    phone: normalized,
    codeHash,
    purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  await sendOtp(normalized, code);
  ok(res, { sent: true }, "OTP sent");
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code, purpose } = req.validated.body;
  const normalized = normalizePhone(phone);
  const otp = await OtpCode.findOne({
    phone: normalized,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!otp) throw ApiError.badRequest("OTP not found or expired");
  if (otp.attempts >= 5) throw ApiError.badRequest("Too many attempts");
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (hash !== otp.codeHash) {
    otp.attempts += 1;
    await otp.save();
    throw ApiError.badRequest("Invalid OTP");
  }
  otp.consumed = true;
  await otp.save();

  let user = await User.findOne({ phone: normalized, deletedAt: null });
  if (!user) {
    user = await User.create({
      name: "User " + normalized.slice(-4),
      phone: normalized,
      phoneVerified: true,
      consentAcceptedAt: new Date(),
    });
  } else if (!user.phoneVerified) {
    user.phoneVerified = true;
    await user.save();
  }
  const access = signAccess(user);
  const refresh = await issueRefresh(user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, refresh.raw);
  ok(res, { user: user.toSafe(), accessToken: access }, "Verified");
});

// ===== Google OAuth =====
// Passport has already authenticated the user and put it on req.user.
// We set the refresh cookie and send the browser back to the client app,
// which then calls POST /auth/refresh to obtain an access token.
export const googleCallback = asyncHandler(async (req, res) => {
  const refresh = await issueRefresh(req.user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, refresh.raw);
  res.redirect(`${env.CLIENT_ORIGIN}/auth/google/success`);
});

// ===== Email Verification =====

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const sendVerification = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.email) throw ApiError.badRequest("No email on account");
  if (user.emailVerified)
    throw ApiError.badRequest("Email already verified");

  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  await EmailVerificationToken.create({
    user: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${raw}`;
  await sendVerificationEmail(user.email, verifyUrl);
  ok(res, { sent: true }, "Verification email sent");
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest("Token required");
  const tokenHash = hashToken(token);
  const record = await EmailVerificationToken.findOne({
    tokenHash,
    consumed: false,
    expiresAt: { $gt: new Date() },
  });
  if (!record) throw ApiError.badRequest("Invalid or expired token");
  const user = await User.findById(record.user);
  if (!user) throw ApiError.notFound("User not found");
  user.emailVerified = true;
  await user.save();
  record.consumed = true;
  await record.save();
  ok(res, { user: user.toSafe() }, "Email verified");
});
