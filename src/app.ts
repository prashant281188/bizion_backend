import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { globalLimiter } from "./middlewares/rateLimit";
import { swaggerSpec } from "./config/swagger";

export const app = express();

app.disable("x-powered-by");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(globalLimiter);
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://127.0.0.1:3000", "http://localhost:6767", "http://localhost:3000", "http://192.168.29.120:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log(origin);

      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(o =>
        origin === o || origin.endsWith(".hinihardware.in")
      );

      if (isAllowed) return callback(null, true);

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Bizion API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

app.use("/api", routes);

app.use(errorHandler);
