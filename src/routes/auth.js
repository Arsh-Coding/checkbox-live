const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { signToken } = require("../config/auth");
const { redisClient } = require("../config/redis");

const USERS_KEY = "admin_users";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  try {
    const storedHash = await redisClient.hGet(USERS_KEY, username);
    if (!storedHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: username, username });
    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;