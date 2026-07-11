import express from "express";
import Movie from "../models/Movie.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.type === "series") query.isSeries = true;
    if (req.query.type === "movie") query.isSeries = false;

    const movies = await Movie.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/random", async (req, res) => {
  try {
    const query = {};
    if (req.query.type === "series") query.isSeries = true;
    if (req.query.type === "movie") query.isSeries = false;

    const count = await Movie.countDocuments(query);
    if (count === 0) return res.status(404).json({ success: false, message: "No movies found" });

    const random = Math.floor(Math.random() * count);
    const movie = await Movie.findOne(query).skip(random);
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/genres", async (req, res) => {
  try {
    const genres = await Movie.distinct("genre");
    res.status(200).json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/search/:query", async (req, res) => {
  try {
    const movies = await Movie.find({
      title: { $regex: req.params.query, $options: "i" },
    });
    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
    res.status(200).json({ success: true, message: "Movie deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
