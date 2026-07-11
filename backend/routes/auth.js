import express from "express";
import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ENV_VARS.ADMIN_EMAIL && password === ENV_VARS.ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true }, ENV_VARS.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

export default router;
