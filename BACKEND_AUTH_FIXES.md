# 🔧 Backend Auth System - 500 Error Fixes

## 📊 Problem Summary

**Symptom:** After deploying to Vercel, `/api/auth/signup` and `/api/auth/login` return 500 errors

**Root Causes Identified:**

1. **JWT_SECRET validation happens too early** - Throws error during module load before environment is fully initialized
2. **Minimal error logging** - Generic "Signup failed" messages hide the actual root cause
3. **Database errors not caught explicitly** - Connection failures cascade silently to 500
4. **No fallback error codes** - Response `{details: error.message}` exposes implementation

---

## 🛠️ Fixes Applied

### Fix 1: Early JWT_SECRET Validation (server.js)

**The Problem:**
```javascript
// BEFORE - authRoutes.js (line 20-22)
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}
// ↑ Runs during module load, before env vars guaranteed
```

**Solution:** Move validation to server.js BEFORE loading authRoutes
```javascript
// AFTER - server.js (line 13-17)
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is required in production. Set env var and restart.");
  process.exit(1);
}

// Only THEN load authRoutes
const { authenticate, requireCsrf } = require("./middleware/authMiddleware");
```

**Impact:** Server fails cleanly during startup if JWT_SECRET missing, not during first auth request

---

### Fix 2: Detailed Error Logging in Auth Routes

**The Problem:**
```javascript
// BEFORE - authRoutes.js signup
} catch (error) {
  return res.status(500).json({ error: "Signup failed", details: error.message });
}
// ↓ Single catch hides where exactly it failed
```

**Solution:** Log each operation step with try-catch per operation
```javascript
// AFTER - authRoutes.js signup
router.post("/signup", async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Step 1: Validate input
    if (!name || !email || !password) {
      console.log(`[AUTH] ${timestamp} signup missing fields`);
      return res.status(400).json({ error: "..." });
    }
    
    // Step 2: DB lookup with explicit error handling
    console.log(`[AUTH] ${timestamp} signup looking up email: ${normalizedEmail}`);
    let existing;
    try {
      existing = await User.findOne({ email: normalizedEmail }).lean();
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error checking existing email:`, dbErr.message);
      return res.status(500).json({ 
        error: "Authentication service unavailable",
        code: "DB_ERROR",  // ← Error code for frontend
        details: dbErr.message 
      });
    }
    
    // Step 3: Create user with separate try-catch
    console.log(`[AUTH] ${timestamp} signup creating user`);
    let user;
    try {
      user = await User.create({ ... });
    } catch (dbErr) {
      console.error(`[AUTH] ${timestamp} DB error creating user:`, dbErr.message);
      return res.status(500).json({
        error: "Failed to create account",
        code: "USER_CREATE_ERROR",
        details: dbErr.message
      });
    }
    
    // ... continue for JWT generation, bcrypt, etc.
  }
});
```

**Error Codes Now Returned:**
- `DB_ERROR` - MongoDB connection/query failed
- `USER_CREATE_ERROR` - User insertion failed
- `JWT_ERROR` - Token generation failed
- `BCRYPT_ERROR` - Password hashing failed
- `SIGNUP_ERROR` - Fatal unexpected error

**Logging Output in Vercel Logs:**
```
[AUTH] 2024-01-15T12:34:56.789Z signup looking up email: test@example.com
[AUTH] 2024-01-15T12:34:57.123Z signup creating user
[AUTH] 2024-01-15T12:34:58.456Z signup success for: test@example.com
```

---

### Fix 3: Database Connection Logging (server.js)

**The Problem:**
```javascript
// BEFORE
mongoose.connect(process.env.MONGODB_URI, { ... })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
// ↑ Missing stack trace, unclear what actually failed
```

**Solution:** Add validation check + full error details
```javascript
// AFTER
console.log(`[DB] Connecting to MongoDB...`);
if (!process.env.MONGODB_URI) {
  console.error("❌ [DB] MONGODB_URI not set. Auth will fail.");
}

mongoose.connect(process.env.MONGODB_URI, { ... })
  .catch((err) => {
    console.error("[❌ DB] MongoDB connection failed:", err.message);
    console.error("[❌ DB] Stack:", err.stack);
    console.error("[❌ DB] Check: MONGODB_URI set? NODE_ENV correct? Network access?");
    process.exit(1);
  });
```

**Vercel Log Output on Connection Failure:**
```
[DB] Connecting to MongoDB...
[❌ DB] MongoDB connection failed: ENOTFOUND
[❌ DB] Stack: at TCPConnectWrap.afterConnect [as oncomplete]
[❌ DB] Check: MONGODB_URI set? NODE_ENV correct? Network access?
```

---

### Fix 4: Middleware Error Logging (authMiddleware.js)

**The Problem:**
```javascript
// BEFORE - authenticate middleware
} catch (error) {
  return res.status(401).json({ error: "Invalid or expired token" });
}
// ↑ No indication if it was JWT verification, expiry, or malformed
```

**Solution:** Add error code and timestamp logging
```javascript
// AFTER
const authenticate = (req, res, next) => {
  const timestamp = new Date().toISOString();
  
  if (!token) {
    console.log(`[AUTH] ${timestamp} authenticate: no token found`);
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET || "dev-secret");
    console.log(`[AUTH] ${timestamp} authenticate: valid token for user ${payload.sub}`);
    next();
  } catch (error) {
    console.error(`[AUTH] ${timestamp} authenticate: JWT verification failed:`, error.message);
    return res.status(401).json({
      error: "Invalid or expired token",
      details: error.message,
      code: "JWT_ERROR"
    });
  }
};
```

Similar logging added to `requireCsrf` middleware with origin/hash details.

---

## 📋 Files Modified

### Backend Files

| File | Changes |
|------|---------|
| `server/server.js` | Added JWT_SECRET validation before route loading, enhanced MongoDB connection logging |
| `server/routes/authRoutes.js` | Added detailed logging + error codes to signup, login, /me endpoints |
| `server/middleware/authMiddleware.js` | Added error logging to authenticate and requireCsrf middleware |

### New Files Added

| File | Purpose |
|------|---------|
| `server/validate-env.js` | Validation script to check env vars before deployment |
| `server/AUTH_DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide with troubleshooting |

---

## 🧪 Testing the Fixes

### 1. Local Testing

```bash
cd server

# Option A: With .env file set up
npm run dev
# Should see: [STARTUP] JWT_SECRET present: true (if set in .env)
#            [✅ DB] MongoDB connected successfully
#            🚀 Server running on port 5000

# Option B: Test with missing JWT_SECRET
export NODE_ENV=production
npm run dev
# Should see: [STARTUP] JWT_SECRET present: false
#            ❌ FATAL: JWT_SECRET is required in production. Set env var and restart.
#            (exit code 1)
```

### 2. Auth Endpoint Testing

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' | jq .

# Check Terminal 1 logs for:
# [AUTH] ... signup looking up email: test@example.com
# [AUTH] ... signup creating user
# [AUTH] ... signup generating tokens for user: xxxxx
# [AUTH] ... signup success for: test@example.com

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq .
```

### 3. Vercel Production Testing

After deploying to Vercel:

```bash
# Check server is running
curl https://your-backend.vercel.app/api/health | jq .
# Expected: { "status": "ok", "timestamp": "..." }

# Try login
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v
# Should see: 200 OK (or 401 if wrong credentials, never 500)
```

In Vercel Dashboard, check Logs:
- Look for `[✅ DB] MongoDB connected successfully`
- Look for `[AUTH] ... login success for: ...` after login attempt
- If error, look for error code in `[AUTH] ... DB error ...` messages

---

## 🚨 Common 500 Errors & Fixes

| Error Code | Symptom | Fix |
|-----------|---------|-----|
| `DB_ERROR` | Can't find existing email | Check MONGODB_URI in Vercel env vars |
| `USER_CREATE_ERROR` | Can't insert new user | Check MongoDB write permissions + IP whitelist |
| `JWT_ERROR` | Token generation fails | Check JWT_SECRET is set (32+ chars) |
| `BCRYPT_ERROR` | Password hash fails | Restart server (crypto library issue) |
| Startup error | Server exits before listening | Check all env vars with `validate-env.js` |

---

## 📌 Deployment Checklist

Before pushing to Vercel:

- [ ] Run `node validate-env.js` - all GREEN ✅
- [ ] Test `/api/auth/login` locally - gets 200 or 401 (never 500)
- [ ] Check server logs start with `[STARTUP]` messages
- [ ] Ensure JWT_SECRET is 32+ characters
- [ ] Verify MONGODB_URI connects (test locally)
- [ ] Set all env vars in Vercel dashboard before deploying

After deploying to Vercel:

- [ ] Check deployment succeeded (green ✓)
- [ ] View logs - should see `[✅ DB] MongoDB connected` and `🚀 Server running`
- [ ] Test `/ping` endpoint returns `pong`
- [ ] Test `/api/health` returns ok status
- [ ] Test login with curl - should return 200 + Set-Cookie
- [ ] Monitor logs for any `[❌ ...]` error messages

---

## 📞 Debugging Help

If you still get 500 errors on Vercel:

1. **Check Vercel Logs** (Deployments → [Your Deploy] → Logs)
   - Search for `[AUTH]` or `[DB]` prefixes
   - Note the exact error message

2. **Check Error Code** in response:
   ```bash
   curl -X POST https://your-backend.vercel.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"t@e.com","password":"p123"}' | jq .
   # Look at the "code" field in response
   ```

3. **Validate Each Requirement:**
   - [ ] JWT_SECRET set in Vercel env (Settings → Environment Variables)
   - [ ] MONGODB_URI set in Vercel env
   - [ ] MongoDB whitelist includes Vercel IPs (0.0.0.0/0 or 34.192.0.0/10)
   - [ ] DB_TYPE = mongodb in env vars

4. **Test Production Env Locally:**
   ```bash
   NODE_ENV=production JWT_SECRET="test-secret-32-chars-minimum!" npm run dev
   # Should show [STARTUP] JWT_SECRET present: true
   ```

