const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const {
  authenticate,
  requireCsrf,
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  hashCsrfToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_SAMESITE = String(process.env.AUTH_COOKIE_SAMESITE || "lax").toLowerCase();

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}

if (!["lax", "strict"].includes(COOKIE_SAMESITE)) {
  throw new Error("AUTH_COOKIE_SAMESITE must be either 'lax' or 'strict'");
}

const parseJwtExpiryMs = (token) => {
  try {
    const payload = jwt.decode(token);
    if (!payload?.exp) return undefined;
    const expiryMs = Number(payload.exp) * 1000 - Date.now();
    return expiryMs > 0 ? expiryMs : 0;
  } catch {
    return undefined;
  }
};

const getCookieDomain = () => {
  const raw = process.env.AUTH_COOKIE_DOMAIN;
  if (!raw) return undefined;
  return String(raw).trim() || undefined;
};

const baseCookieOptions = (maxAge) => ({
  secure: IS_PRODUCTION ? true : false,
  sameSite: COOKIE_SAMESITE,
  path: "/",
  domain: getCookieDomain(),
  ...(typeof maxAge === "number" ? { maxAge } : {}),
});

const setAuthCookies = (res, token, csrfToken) => {
  const maxAge = parseJwtExpiryMs(token);
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(maxAge),
    httpOnly: true,
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    ...baseCookieOptions(maxAge),
    httpOnly: false,
  });
};

const clearAuthCookies = (res) => {
  const options = baseCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, options);
  res.clearCookie(CSRF_COOKIE_NAME, options);
};

const signToken = (user, csrfHash) =>
  jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      csrf: csrfHash,
    },
    JWT_SECRET || "dev-insecure-secret-change-in-production",
    { expiresIn: JWT_EXPIRES_IN }
  );

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const csrfToken = crypto.randomBytes(32).toString("hex");
    const token = signToken(user, hashCsrfToken(csrfToken));
    setAuthCookies(res, token, csrfToken);

    return res.status(201).json({
      success: true,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Signup failed", details: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const csrfToken = crypto.randomBytes(32).toString("hex");
    const token = signToken(user, hashCsrfToken(csrfToken));
    setAuthCookies(res, token, csrfToken);

    return res.json({
      success: true,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed", details: error.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch profile", details: error.message });
  }
});

router.post("/logout", authenticate, requireCsrf, (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: "Logged out" });
});

module.exports = router;
