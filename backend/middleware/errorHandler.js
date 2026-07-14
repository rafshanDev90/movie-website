import { ENV_VARS } from "../config/envVars.js";

const isOperationalError = (err) => {
  return err.statusCode && err.statusCode < 500;
};

const errorHandler = (err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS policy denied" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  if (err.code === "ENOENT") {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  if (isOperationalError(err)) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (ENV_VARS.NODE_ENV === "development") {
    console.error("Unhandled error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      stack: err.stack,
    });
  }

  console.error("Unhandled error:", err.message);
  return res.status(500).json({ success: false, message: "Internal server error" });
};

export default errorHandler;
