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
const COOKIE_SAMESITE = "lax";

if (!JWT_SECRET) {
  console.warn(`[⚠️  AUTH] authRoutes loaded but JWT_SECRET is empty. Server startup will validate this.`);
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
    const timestamp = new Date().toISOString();

    if (!name || !email || !password) {
      console.log(`[AUTH] ${timestamp} signup missing fields`);
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      console.log(`[AUTH] ${timestamp} signup password too short`);
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log(`[AUTH] ${timestamp} signup looking up email: ${normalizedEmail}`);
    
    let existing;
    try {
      existing = await User.findOne({ email: normalizedEmail }).lean();
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error checking existing email:`, dbErr.message);
      console.error(`[AUTH] ${timestamp} DB stack:`, dbErr.stack);
      return res.status(500).json({ 
        error: "Authentication service unavailable", 
        code: "DB_ERROR",
        details: `Database error: ${dbErr.message}` 
      });
    }
    
    if (existing) {
      console.log(`[AUTH] ${timestamp} signup email already exists: ${normalizedEmail}`);
      return res.status(409).json({ error: "Email already exists" });
    }

    console.log(`[AUTH] ${timestamp} signup hashing password`);
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log(`[AUTH] ${timestamp} signup creating user`);
    let user;
    try {
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error creating user:`, dbErr.message);
      console.error(`[AUTH] ${timestamp} DB stack:`, dbErr.stack);
      return res.status(500).json({ 
        error: "Failed to create account", 
        code: "USER_CREATE_ERROR",
        details: `Database error: ${dbErr.message}` 
      });
    }

    console.log(`[AUTH] ${timestamp} signup generating tokens for user: ${user._id}`);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    let token;
    try {
      token = signToken(user, hashCsrfToken(csrfToken));
    } catch (jwtErr) {
      console.error(`[AUTH] ${timestamp} JWT error:`, jwtErr.message);
      return res.status(500).json({ 
        error: "Token generation failed", 
        code: "JWT_ERROR",
        details: `JWT error: ${jwtErr.message}` 
      });
    }
    
    setAuthCookies(res, token, csrfToken);

    console.log(`[AUTH] ${timestamp} signup success for: ${normalizedEmail}`);
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
    const timestamp = new Date().toISOString();
    console.error(`[AUTH] ${timestamp} signup FATAL error:`, error.message);
    console.error(`[AUTH] ${timestamp} signup stack:`, error.stack);
    return res.status(500).json({ 
      error: "Signup failed", 
      details: error.message,
      code: "SIGNUP_ERROR" 
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const timestamp = new Date().toISOString();

    if (!email || !password) {
      console.log(`[AUTH] ${timestamp} login missing fields`);
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log(`[AUTH] ${timestamp} login looking up user: ${normalizedEmail}`);
    
    let user;
    try {
      user = await User.findOne({ email: normalizedEmail }).select("+password");
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error finding user:`, dbErr.message);
      console.error(`[AUTH] ${timestamp} DB stack:`, dbErr.stack);
      return res.status(500).json({ 
        error: "Authentication service unavailable", 
        code: "DB_ERROR",
        details: `Database error: ${dbErr.message}` 
      });
    }

    if (!user) {
      console.log(`[AUTH] ${timestamp} login user not found: ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`[AUTH] ${timestamp} login comparing passwords`);
    let isValid;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error(`[AUTH] ${timestamp} bcrypt error:`, bcryptErr.message);
      return res.status(500).json({ 
        error: "Password verification failed", 
        code: "BCRYPT_ERROR",
        details: `Crypto error: ${bcryptErr.message}` 
      });
    }
    
    if (!isValid) {
      console.log(`[AUTH] ${timestamp} login invalid password: ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`[AUTH] ${timestamp} login generating tokens for user: ${user._id}`);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    let token;
    try {
      token = signToken(user, hashCsrfToken(csrfToken));
    } catch (jwtErr) {
      console.error(`[AUTH] ${timestamp} JWT error:`, jwtErr.message);
      return res.status(500).json({ 
        error: "Token generation failed", 
        code: "JWT_ERROR",
        details: `JWT error: ${jwtErr.message}` 
      });
    }
    
    setAuthCookies(res, token, csrfToken);

    console.log(`[AUTH] ${timestamp} login success for: ${normalizedEmail}`);
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
    const timestamp = new Date().toISOString();
    console.error(`[AUTH] ${timestamp} login FATAL error:`, error.message);
    console.error(`[AUTH] ${timestamp} login stack:`, error.stack);
    return res.status(500).json({ 
      error: "Login failed", 
      details: error.message,
      code: "LOGIN_ERROR" 
    });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH] ${timestamp} /me request for user: ${req.user.id}`);
    
    let user;
    try {
      user = await User.findById(req.user.id).lean();
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error fetching user:`, dbErr.message);
      return res.status(500).json({ 
        error: "Failed to fetch profile", 
        code: "DB_ERROR",
        details: `Database error: ${dbErr.message}` 
      });
    }
    
    if (!user) {
      console.warn(`[AUTH] ${timestamp} /me user not found in DB: ${req.user.id}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[AUTH] ${timestamp} /me success for user: ${req.user.id}`);
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[AUTH] ${timestamp} /me FATAL error:`, error.message);
    console.error(`[AUTH] ${timestamp} /me stack:`, error.stack);
    return res.status(500).json({ 
      error: "Failed to fetch profile", 
      details: error.message,
      code: "ME_ERROR" 
    });
  }
});

router.post("/logout", authenticate, requireCsrf, (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: "Logged out" });
});

module.exports = router;
