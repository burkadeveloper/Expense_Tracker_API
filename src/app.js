// import express from "express";
// import helmet from "helmet";
// import cors from "cors";
// import compression from "compression";
// import morgan from "morgan";
// import cookieParser from "cookie-parser";
// import env from "./config/env.js";
// import passport from "./config/passport.js";
// import routes from "./routes/index.js";
// import { errorHandler, notFoundHandler } from "./middleware/error.js";

// export function createApp() {
//   const app = express();
  
//   // Support comma-separated origins in CLIENT_ORIGIN
//   const allowedOrigins = (env.CLIENT_ORIGIN || "https://expense-tracker-f-alpha.vercel.app")
//     .split(",")
//     .map((o) => o.trim())
//     .filter(Boolean);
//   // Always allow the backend's own origin
//   if (env.NODE_ENV === "production" && !allowedOrigins.length) {
//     allowedOrigins.push("https://expense-tracker-f-alpha.vercel.app/login");
//   }
// app.set("trust proxy", 1);
//   app.use(helmet());

//   app.use(
//     cors({
//       origin(origin, callback) {
//         // Allow same-origin / server-side requests / curl (no Origin header)
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.includes(origin)) return callback(null, true);
//         return callback(new Error(`CORS blocked: ${origin}`));
//       },
//       credentials: true,
//       methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
//       allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
//       exposedHeaders: ["Set-Cookie"],
//     }),
//   );
//   app.use(compression());
//   app.use(express.json({ limit: "5mb" }));
//   app.use(cookieParser());
//   app.use(morgan("tiny"));
//   app.use(passport.initialize());
//   app.use("/api/v1", routes);
//   app.use(notFoundHandler);
//   app.use(errorHandler);
//   return app;
// }












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

  // Helmet with cross-origin policies relaxed so the Google OAuth redirect
  // can land on the frontend and the browser will send the rt cookie
  // cross-site (sameSite=none; Secure).
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // Support comma-separated origins in CLIENT_ORIGIN
  const allowedOrigins = (env.CLIENT_ORIGIN || "https://expense-tracker-f-alpha.vercel.app")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      // Allow server-side / curl requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Return false (not an error) so the browser gets a proper 403, not a 500
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // Handle preflight for every route
  app.options("*", cors(corsOptions));
  app.use(cors(corsOptions));
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

