import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { globalLimiter } from "./middlewares/rateLimit";

export const app = express();

app.disable("x-powered-by");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(globalLimiter);

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorHandler);
