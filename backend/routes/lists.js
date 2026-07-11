import express from "express";
import List from "../models/List.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.genre) query.genre = req.query.genre;

    const lists = await List.find(query).populate("content").limit(10);
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/all", adminAuth, async (req, res) => {
  try {
    const lists = await List.find().populate("content");
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate("content");
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const list = new List(req.body);
    await list.save();
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ success: false, message: "List not found" });
    res.status(200).json({ success: true, message: "List deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
