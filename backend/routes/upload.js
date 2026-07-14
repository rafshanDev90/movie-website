import express from "express";
import path from "path";
import fs from "fs";
import upload from "../services/fileService.js";
import adminAuth from "../middleware/adminAuth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const VIDEOS_DIR = path.join(path.resolve(), "backend/uploads/videos");

function sanitizeFilename(filename) {
  const safe = path.basename(filename);
  if (safe !== filename || safe.includes("..") || safe.includes("/") || safe.includes("\\")) {
    return null;
  }
  return safe;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
  };
  return types[ext] || "application/octet-stream";
}

router.post("/upload", adminAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const type = req.file.mimetype.startsWith("video/") ? "videos" : "images";
  const fileUrl = `/uploads/${type}/${req.file.filename}`;

  res.status(200).json({ success: true, url: fileUrl, filename: req.file.filename });
});

router.get("/stream/:filename", asyncHandler(async (req, res) => {
  const safe = sanitizeFilename(req.params.filename);
  if (!safe) {
    return res.status(400).json({ success: false, message: "Invalid filename" });
  }

  const filePath = path.join(VIDEOS_DIR, safe);

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    throw err;
  }

  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": getMimeType(safe),
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": getMimeType(safe),
    });
    fs.createReadStream(filePath).pipe(res);
  }
}));

router.get("/download/:filename", asyncHandler(async (req, res) => {
  const safe = sanitizeFilename(req.params.filename);
  if (!safe) {
    return res.status(400).json({ success: false, message: "Invalid filename" });
  }

  const filePath = path.join(VIDEOS_DIR, safe);
  try {
    await fs.promises.access(filePath);
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    throw err;
  }
  res.download(filePath, safe);
}));

export default router;
