import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";

import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { globalLimiter } from "./middlewares/rateLimit";

export const app = express();

app.disable("x-powered-by");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(globalLimiter);
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.29.120:3000",
  "http://192.168.31.216:3000",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", routes);

app.use(errorHandler);
