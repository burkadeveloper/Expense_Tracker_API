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
  app.set("trust proxy", 1);

  // Support comma-separated origins in CLIENT_ORIGIN and normalize trailing slashes
  const envOrigins = (env.CLIENT_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const allowedOrigins = [
    ...new Set([
      ...envOrigins,
      "https://expense-tracker-gamma-ten-88.vercel.app",
      "https://expense-tracker-api-e1a1.onrender.com",
      ...(env.NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
    ]),
  ];

  const corsOptions = {
    origin(origin, callback) {
      // Allow same-origin / server-side requests / curl (no Origin header)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Cleanly deny without triggering a 500 server error
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // 1. Run CORS and preflight handling FIRST
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // 2. Allow cross-origin API responses through Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
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
