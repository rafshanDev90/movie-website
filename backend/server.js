import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import { ENV_VARS } from "./config/envVars.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import listRoutes from "./routes/lists.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const PORT = ENV_VARS.PORT;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
];

if (ENV_VARS.NODE_ENV === "production") {
  ALLOWED_ORIGINS.push("https://yourdomain.com");
}

app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/movies", movieRoutes);
app.use("/api/v1/lists", listRoutes);
app.use("/api/v1", uploadRoutes);

app.use("/uploads", express.static(path.join(path.resolve(), "backend/uploads")));

if (ENV_VARS.NODE_ENV === "production") {
  app.use("/admin", express.static(path.join(path.resolve(), "admin/dist")));
  app.use(express.static(path.join(path.resolve(), "client/dist")));

  app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(path.resolve(), "admin/dist/index.html"));
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(path.resolve(), "client/dist/index.html"));
  });
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS policy denied" });
  }
  next(err);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

server.timeout = 30000;

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
