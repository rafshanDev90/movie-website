import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { ENV_VARS } from "./config/envVars.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import listRoutes from "./routes/lists.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const PORT = ENV_VARS.PORT;

app.use(cors());
app.use(cookieParser());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
