import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  phoneRequestOtpSchema,
  phoneVerifyOtpSchema,
} from "../validators/auth.validator.js";
import * as c from "../controllers/auth.controller.js";
import passport, { googleEnabled } from "../config/passport.js";
import env from "../config/env.js";

const router = Router();
router.post("/register", authLimiter, validate(registerSchema), c.register);
router.post("/login", authLimiter, validate(loginSchema), c.login);
router.post("/refresh", c.refresh);
router.post("/logout", requireAuth, c.logout);
router.post("/logout-all", requireAuth, c.logoutAll);
router.get("/me", requireAuth, c.me);
router.post("/send-verification", requireAuth, c.sendVerification);
router.post("/verify-email", c.verifyEmail);
router.post(
  "/phone/request-otp",
  otpLimiter,
  validate(phoneRequestOtpSchema),
  c.requestOtp,
);
router.post(
  "/phone/verify-otp",
  otpLimiter,
  validate(phoneVerifyOtpSchema),
  c.verifyOtp,
);

// ===== Google OAuth =====
const googleGuard = (req, res, next) =>
  googleEnabled
    ? next()
    : res.status(503).json({
        success: false,
        data: null,
        message: "Google sign-in is not configured",
        errors: [],
      });

router.get(
  "/google",
  googleGuard,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  googleGuard,
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_ORIGIN}/login?error=google`,
  }),
  c.googleCallback,
);

export default router;
