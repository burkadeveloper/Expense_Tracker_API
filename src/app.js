import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import passport from "./config/passport.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  
  // Support comma-separated origins in CLIENT_ORIGIN
  const allowedOrigins = (env.CLIENT_ORIGIN || "https://expense-tracker-f-alpha.vercel.app")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // Always allow the backend's own origin
  if (env.NODE_ENV === "production" && !allowedOrigins.length) {
    allowedOrigins.push("https://expense-tracker-f-alpha.vercel.app/login");
  }
app.set("trust proxy", 1);
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-side requests / curl (no Origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposedHeaders: ["Set-Cookie"],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  app.use(morgan("tiny"));
  app.use(passport.initialize());
  app.use("/api/v1", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
