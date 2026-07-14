import express from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import Movie from "../models/Movie.js";
import adminAuth from "../middleware/adminAuth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const MOVIE_FIELDS = ["title", "description", "image", "imageTitle", "imageSmall", "trailer", "video", "year", "limit", "genre", "duration", "isSeries"];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pickFields(obj, allowed) {
  const picked = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) picked[key] = obj[key];
  }
  return picked;
}

router.get("/", asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.type === "series") query.isSeries = true;
  if (req.query.type === "movie") query.isSeries = false;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const movies = await Movie.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Movie.countDocuments(query);

  res.status(200).json({ success: true, data: movies, total, page, pages: Math.ceil(total / limit) });
}));

router.get("/random", asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.type === "series") query.isSeries = true;
  if (req.query.type === "movie") query.isSeries = false;

  const count = await Movie.countDocuments(query);
  if (count === 0) return res.status(404).json({ success: false, message: "No movies found" });

  const random = Math.floor(Math.random() * count);
  const movie = await Movie.findOne(query).skip(random);
  res.status(200).json({ success: true, data: movie });
}));

router.get("/genres", asyncHandler(async (req, res) => {
  const genres = await Movie.distinct("genre");
  res.status(200).json({ success: true, data: genres });
}));

router.get("/search/:query", asyncHandler(async (req, res) => {
  const { query } = req.params;
  if (!query || query.length > 100) {
    return res.status(400).json({ success: false, message: "Invalid search query" });
  }

  const escaped = escapeRegex(query);
  const movies = await Movie.find({
    title: { $regex: escaped, $options: "i" },
  }).limit(20);

  res.status(200).json({ success: true, data: movies });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid movie ID" });
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
  res.status(200).json({ success: true, data: movie });
}));

router.post("/", adminAuth, asyncHandler(async (req, res) => {
  const data = pickFields(req.body, MOVIE_FIELDS);
  if (!data.title) {
    return res.status(400).json({ success: false, message: "Title is required" });
  }

  const movie = new Movie(data);
  await movie.save();
  res.status(201).json({ success: true, data: movie });
}));

router.put("/:id", adminAuth, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid movie ID" });
  }

  const data = pickFields(req.body, MOVIE_FIELDS);
  const movie = await Movie.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
  res.status(200).json({ success: true, data: movie });
}));

router.delete("/:id", adminAuth, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid movie ID" });
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

  const uploadsDir = path.join(path.resolve(), "backend/uploads");
  const unlink = async (url) => {
    if (!url) return;
    const filename = path.basename(url);
    const dir = url.includes("/videos/") ? "videos" : "images";
    try {
      await fs.promises.unlink(path.join(uploadsDir, dir, filename));
    } catch {}
  };

  await Promise.all([
    unlink(movie.image),
    unlink(movie.imageTitle),
    unlink(movie.imageSmall),
    unlink(movie.trailer),
    unlink(movie.video),
  ]);

  await Movie.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Movie deleted" });
}));

export default router;
