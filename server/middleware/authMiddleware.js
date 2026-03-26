const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { setCurrentUserId, runWithUserContext } = require("./requestContext");

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "dm_auth";
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "dm_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const AUTH_ALLOW_BEARER = process.env.AUTH_ALLOW_BEARER === "true";
const ALLOWED_SAMESITE = new Set(["lax", "strict"]);

const requestedSameSite = String(process.env.AUTH_COOKIE_SAMESITE || "lax").toLowerCase();
if (!ALLOWED_SAMESITE.has(requestedSameSite)) {
  throw new Error("AUTH_COOKIE_SAMESITE must be either 'lax' or 'strict'");
}

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}

const hashCsrfToken = (value) =>
  crypto
    .createHash("sha256")
    .update(String(value || ""))
    .digest("hex");

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7);
};

const getRequestToken = (req) => {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] || "";
  if (cookieToken) return { token: cookieToken, source: "cookie" };

  if (!AUTH_ALLOW_BEARER) {
    return { token: "", source: "none" };
  }

  const bearerToken = getBearerToken(req);
  if (bearerToken) return { token: bearerToken, source: "bearer" };

  return { token: "", source: "none" };
};

const authenticate = (req, res, next) => {
  const { token, source } = getRequestToken(req);
  const timestamp = new Date().toISOString();
  
  if (!token) {
    console.log(`[AUTH] ${timestamp} authenticate: no token found`);
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET || "dev-insecure-secret-change-in-production");
    console.log(`[AUTH] ${timestamp} authenticate: valid token for user ${payload.sub}`);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      csrfHash: payload.csrf || "",
    };
    req.auth = {
      tokenSource: source,
    };
    return runWithUserContext(payload.sub, () => {
      setCurrentUserId(payload.sub);
      next();
    });
  } catch (error) {
    console.error(`[AUTH] ${timestamp} authenticate: JWT verification failed:`, error.message);
    return res.status(401).json({ 
      error: "Invalid or expired token",
      details: error.message,
      code: "JWT_ERROR" 
    });
  }
};

const requireCsrf = (req, res, next) => {
  const timestamp = new Date().toISOString();
  
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (req.auth?.tokenSource !== "cookie") {
    console.log(`[AUTH] ${timestamp} CSRF: skipping (token source: ${req.auth?.tokenSource})`);
    return next();
  }

  const headerToken = String(req.get(CSRF_HEADER_NAME) || "").trim();
  const cookieToken = String(req.cookies?.[CSRF_COOKIE_NAME] || "").trim();

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    console.error(`[AUTH] ${timestamp} CSRF: header/cookie mismatch (has header: ${!!headerToken}, has cookie: ${!!cookieToken})`);
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  const origin = req.get("origin") || "";
  const host = req.get("host") || "";
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        console.error(`[AUTH] ${timestamp} CSRF: origin mismatch ${originHost} !== ${host}`);
        return res.status(403).json({ error: "CSRF origin mismatch" });
      }
    } catch (e) {
      console.error(`[AUTH] ${timestamp} CSRF: origin URL parse error:`, e.message);
      return res.status(403).json({ error: "CSRF origin mismatch" });
    }
  }

  const expectedHash = req.user?.csrfHash || "";
  if (!expectedHash || hashCsrfToken(headerToken) !== expectedHash) {
    console.error(`[AUTH] ${timestamp} CSRF: hash mismatch (has expected: ${!!expectedHash})`);
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  console.log(`[AUTH] ${timestamp} CSRF: validation passed`);
  return next();
};

module.exports = {
  authenticate,
  requireCsrf,
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  hashCsrfToken,
};
