# 🚀 Backend Auth System - Deployment Checklist

## Before Deploying to Vercel

### 1. Environment Variables ✅
Set ALL of these in Vercel dashboard (Settings → Environment Variables):

```
JWT_SECRET              = (32+ char random secret)
NODE_ENV                = production
DB_TYPE                 = mongodb
MONGODB_URI             = (your MongoDB connection string)
CORS_ALLOWED_ORIGINS    = (your frontend domain, e.g., https://app.yoursite.com)
FRONTEND_URL            = (your frontend domain)
PORT                    = 5000
```

### 2. Validation (Local First!)
```bash
# Before pushing to Vercel, test locally:
node server/validate-env.js

# Should show:
# ✅ JWT_SECRET is set
# ✅ MONGODB_URI is set
# ✅ All critical environment variables are set!
```

### 3. Test Auth Endpoints Locally
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Test health check
curl http://localhost:5000/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
# Expected: { "success": true, "user": { ... } }

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -i
# Expected: 200 OK + Set-Cookie headers
```

### 4. Check Logs in Dev Environment
When you test, look for these log lines (all should succeed):
```
[STARTUP] JWT_SECRET present: true
[STARTUP] DB_TYPE: mongodb
[STARTUP] MONGODB_URI present: true
[✅ DB] MongoDB connected successfully
[AUTH] ... signup looking up email: test@example.com
[AUTH] ... signup success for: test@example.com
[✅ AUTH] Routes mounting...
```

### 5. Deploy to Vercel
```bash
# Ensure all env vars are set in Vercel dashboard
git push origin main
# Vercel will auto-deploy
```

### 6. Test on Vercel Production

#### Health Check
```bash
curl https://your-backend-url.vercel.app/ping
# Expected: pong
```

#### Watch Logs
In Vercel dashboard: Deployments → Latest → Logs (scroll down)
- Should see: `🚀 Server running on port 5000`
- Should see: `[✅ DB] MongoDB connected successfully`
- Should NOT see: `❌ FATAL` errors

#### Test Login on Vercel
```bash
curl -X POST https://your-backend-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -i

# Check response headers for Set-Cookie:
# Expected: Set-Cookie: dm_auth=...; Path=/; Secure; SameSite=Lax; HttpOnly
```

---

## 🚨 If You Get 500 Errors on /api/auth/signup or /login:

### Check 1: JWT_SECRET is Set
```bash
# In Vercel Logs, should see:
[STARTUP] JWT_SECRET present: true

# If you see: [STARTUP] JWT_SECRET present: false
# → Go to Vercel Dashboard → Settings → Environment Variables
# → Add JWT_SECRET with a 32+ character random value
```

### Check 2: MongoDB Connection
```bash
# In Vercel Logs, should see:
[✅ DB] MongoDB connected successfully

# If you see: [❌ DB] MongoDB connection failed
# → Check MONGODB_URI is correct in Vercel env vars
# → Verify MongoDB IP whitelist allows Vercel IPs (0.0.0.0/0 for simplicity)
# → Test MONGODB_URI locally: node -e "require('mongoose').connect(process.env.MONGODB_URI)"
```

### Check 3: Full Error Response
The 500 error now includes detailed debugging info:
```json
{
  "error": "Signup failed",
  "code": "DB_ERROR",
  "details": "Original database error message here"
}
```

Look for the `code` field:
- `DB_ERROR` → MongoDB connection problem
- `JWT_ERROR` → JWT_SECRET issue
- `USER_CREATE_ERROR` → MongoDB write failed
- `BCRYPT_ERROR` → Password hashing failed
- `SIGNUP_ERROR` → Unexpected error

### Check 4: Server Logs
Vercel shows detailed logs:
1. Go to Vercel Dashboard → Deployments → [Your Deploy] → Logs
2. Scroll down to find error lines starting with `[AUTH]` or `[DB]`
3. These show exact failure point
4. Example:
   ```
   [AUTH] 2024-01-15T12:34:56.789Z signup looking up email: test@example.com
   [AUTH] 2024-01-15T12:34:57.123Z DB error checking existing email: connect ENOTFOUND
   ```

---

## 📌 Critical Files Modified

These files now have detailed logging and error handling:

1. **server/server.js**
   - Validates JWT_SECRET BEFORE loading routes
   - Better MongoDB connection logging
   - [STARTUP], [DB] log prefixes

2. **server/routes/authRoutes.js**
   - Timestamp + detailed error logging in signup/login/me
   - Separate try-catch for each DB operation
   - Error codes in response (DB_ERROR, JWT_ERROR, etc.)

3. **server/middleware/authMiddleware.js**
   - JWT verification error details
   - CSRF validation logging
   - Error codes in JSON responses

---

## 🧪 Local Development Testing

Test that 500 errors show proper details:

```bash
# Test with missing JWT_SECRET
unset JWT_SECRET
npm run dev
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@example.com","password":"password123"}'
# Should see [AUTH] timestamp logs in terminal

# Test with bad MongoDB connection
export MONGODB_URI="mongodb://invalid/test"
npm run dev
# Should see [❌ DB] MongoDB connection failed in logs
```

---

## 🔍 Key Changes Made

### 1. Early JWT_SECRET Validation
**Before:** Error thrown during authRoutes.js module load
**After:** Validated in server.js BEFORE requiring authRoutes
**Impact:** Server fails cleanly with clear message instead of hanging

### 2. Detailed Logging
**Before:** Generic "Signup failed" with no details
**After:** Each step logged with timestamp
```
[AUTH] 2024-01-15T12:34:56.789Z signup looking up email: test@example.com
[AUTH] 2024-01-15T12:34:57.123Z signup creating user
[AUTH] 2024-01-15T12:34:58.456Z signup success for: test@example.com
```
**Impact:** Can pinpoint exact failure point in Vercel logs

### 3. Separate Error Handling
**Before:** Single catch-all, loses error context
**After:** Try-catch around each operation (DB lookup, creation, JWT, bcrypt)
**Impact:** Response includes error code so frontend knows what failed

### 4. Database Connection Guarantee
**Before:** User.findOne() fails silently if DB disconnected
**After:** Each DB call wrapped with explicit error logging and response
**Impact:** Can see MongoDB errors in server logs immediately

---

## ⚡ Debugging Commands (Vercel)

```bash
# View last 100 lines of logs
vercel logs [deployment-url] --tail

# Check env vars are set
vercel env ls

# Rebuild if stuck
vercel redeploy
```

---

## ✅ Success Indicators

If everything is working:

1. ✅ Vercel build succeeds (green checkmark in deployments)
2. ✅ `/api/health` returns `{ "status": "ok" }`
3. ✅ `/api/auth/login` returns 200 with Set-Cookie headers
4. ✅ Logs show `[✅ DB] MongoDB connected successfully`
5. ✅ Logs show `[AUTH] ... login success for: ...`
6. ✅ Frontend can authenticate and access protected routes

---

## 💡 Tips

- **Never commit JWT_SECRET** to version control
- **Always test auth locally first** before pushing to production
- **Keep MONGODB_URI safe** - it contains username/password
- **Monitor Vercel logs** after deployment for [AUTH] errors
- **Check MongoDB logs** for connection/write failures

