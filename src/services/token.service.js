import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import env from "../config/env.js";
import RefreshToken from "../models/RefreshToken.js";

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function signAccess(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL },
  );
}

export async function issueRefresh(user, meta = {}) {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000,
  );
  await RefreshToken.create({
    user: user._id,
    tokenHash: hash(raw),
    expiresAt,
    userAgent: meta.userAgent,
    ip: meta.ip,
  });
  return { raw, expiresAt };
}

export async function rotateRefresh(rawToken, meta = {}) {
  const hashValue = hash(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash: hashValue });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date())
    return null;
  existing.revokedAt = new Date();
  await existing.save();
  const userDoc = await existing.populate("user");
  const next = await issueRefresh(userDoc.user, meta);
  return { user: userDoc.user, refresh: next };
}

export async function revokeAll(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() },
  );
}

export async function revokeOne(rawToken) {
  await RefreshToken.updateOne(
    { tokenHash: hash(rawToken) },
    { revokedAt: new Date() },
  );
}

export function setRefreshCookie(res, raw) {
  res.cookie("rt", raw, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000,
    path: "/",
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("rt", { path: "/" });
}
