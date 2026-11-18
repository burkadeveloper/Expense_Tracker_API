import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized("Missing token");
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.deletedAt) throw ApiError.unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(
      err.name === "JsonWebTokenError"
        ? ApiError.unauthorized("Invalid token")
        : err,
    );
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return next(ApiError.forbidden());
  next();
}
