import express from "express";
import mongoose from "mongoose";
import List from "../models/List.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const LIST_FIELDS = ["title", "type", "genre", "content"];

function pickFields(obj, allowed) {
  const picked = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) picked[key] = obj[key];
  }
  return picked;
}

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.genre) query.genre = req.query.genre;

    const lists = await List.find(query).populate("content").limit(10);
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/all", adminAuth, async (req, res) => {
  try {
    const lists = await List.find().populate("content");
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid list ID" });
    }

    const list = await List.findById(req.params.id).populate("content");
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const data = pickFields(req.body, LIST_FIELDS);
    if (!data.title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const list = new List(data);
    await list.save();
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "List with this title already exists" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid list ID" });
    }

    const data = pickFields(req.body, LIST_FIELDS);
    const list = await List.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "List with this title already exists" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid list ID" });
    }

    const list = await List.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, message: "List deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
