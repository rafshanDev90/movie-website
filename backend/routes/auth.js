import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV_VARS } from "../config/envVars.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (email !== ENV_VARS.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(String(password), ENV_VARS.ADMIN_PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ isAdmin: true }, ENV_VARS.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ success: true, token });
  } catch {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
