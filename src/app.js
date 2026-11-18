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

  const allowedOrigins = [
    env.CLIENT_ORIGIN?.replace(/\/$/, ""),
    "https://expense-tracker-gamma-ten-88.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      // Allow requests with no origin (like Postman, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // 1. Apply CORS and preflight handling BEFORE helmet and routes
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // 2. Configure Helmet so it doesn't block cross-origin API responses
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
