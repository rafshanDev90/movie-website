import express from "express";
import path from "path";
import fs from "fs";
import upload from "../services/fileService.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/upload", adminAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const type = req.file.mimetype.startsWith("video/") ? "videos" : "images";
  const fileUrl = `/uploads/${type}/${req.file.filename}`;

  res.status(200).json({ success: true, url: fileUrl, filename: req.file.filename });
});

router.get("/stream/:filename", (req, res) => {
  const { filename } = req.params;
  const videosDir = path.join(path.resolve(), "backend/uploads/videos");
  const filePath = path.join(videosDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const videosDir = path.join(path.resolve(), "backend/uploads/videos");
  const filePath = path.join(videosDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.download(filePath, filename);
});

export default router;
