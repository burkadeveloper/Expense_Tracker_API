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
  app.use(helmet());
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN],
      credentials: true,
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
