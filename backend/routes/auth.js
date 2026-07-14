import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { ENV_VARS } from "../config/envVars.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again in 15 minutes" },
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
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
}));

export default router;
