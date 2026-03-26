const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

const { authenticate, requireCsrf } = require("./middleware/authMiddleware");
const { requestContextMiddleware } = require("./middleware/requestContext");

const clientRoutes = require("./routes/clientRoutes");
const milkRoutes = require("./routes/milkRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const advanceRoutes = require("./routes/advanceRoutes");
const consumerRoutes = require("./routes/consumerRoutes");
const consumerSalesRoutes = require("./routes/consumerSalesRoutes");
const consumerPaymentRoutes = require("./routes/consumerPaymentRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS Configuration - Restrict to frontend domain
const allowedOrigins = String(
  process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS blocked for this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(process.env.COOKIE_SECRET || "dev-cookie-secret"));
app.use(
  "/api",
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(requestContextMiddleware);

// Simple request logger (non-production)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    // Sanitized logging - don't log passwords or tokens
    const sanitizedUrl = req.url.replace(/password=\w+/g, "password=***");
    console.log(`[${new Date().toISOString()}] ${req.method} ${sanitizedUrl}`);
    next();
  });
}

// Database initialization
if (process.env.DB_TYPE === 'mongodb') {
  // Connect to MongoDB
  console.log("Connecting to MongoDB...");

  // Add connection event listeners
  mongoose.connection.on('connected', () => console.log('✅ Mongoose connected to MongoDB'));
  mongoose.connection.on('error', (err) => console.log('❌ Mongoose connection error:', err.message));
  mongoose.connection.on('disconnected', () => console.log('⚠️  Mongoose disconnected'));

  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    tls: true,
    retryWrites: true
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    const PORT = process.env.PORT || 5000;
    startServer(PORT);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
} else {
  // Initialize SQLite database
  const dbPath = path.join(__dirname, "dairyDB.db");
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("❌ SQLite Connection Error:", err.message);
      process.exit(1);
    } else {
      console.log("✅ SQLite Connected Successfully");
      
      // Create clients table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error("Table creation error:", err.message);
      });

      // Create milk_entries table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS milk_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId INTEGER NOT NULL,
          type TEXT NOT NULL,
          litres REAL NOT NULL,
          fat REAL NOT NULL,
          snf REAL NOT NULL,
          rate REAL NOT NULL,
          total REAL NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clientId) REFERENCES clients(id)
        )
      `, (err) => {
        if (err) console.error("Milk entries table creation error:", err.message);
      });

      // Create settlements table for periodic settlements (every 10 days)
      db.run(`
        CREATE TABLE IF NOT EXISTS settlements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId INTEGER NOT NULL,
          startDate DATE NOT NULL,
          endDate DATE NOT NULL,
          totalLitres REAL NOT NULL DEFAULT 0,
          totalAmount REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clientId) REFERENCES clients(id)
        )
      `, (err) => {
        if (err) console.error("Settlements table creation error:", err.message);
      });

      // Create payments table to track all payments
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId INTEGER NOT NULL,
          settlementId INTEGER,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          date DATE NOT NULL,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clientId) REFERENCES clients(id),
          FOREIGN KEY (settlementId) REFERENCES settlements(id)
        )
      `, (err) => {
        if (err) console.error("Payments table creation error:", err.message);
      });

      // Create advances table to track advances given to clients
      db.run(`
        CREATE TABLE IF NOT EXISTS advances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId INTEGER NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          purpose TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clientId) REFERENCES clients(id)
        )
      `, (err) => {
        if (err) console.error("Advances table creation error:", err.message);
      });

      // Create consumers table for customers who buy milk
      db.run(`
        CREATE TABLE IF NOT EXISTS consumers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          type TEXT NOT NULL DEFAULT 'regular',
          credit_limit REAL DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error("Consumers table creation error:", err.message);
      });

      // Create consumer_sales table for daily milk sales to consumers
      db.run(`
        CREATE TABLE IF NOT EXISTS consumer_sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          consumerId INTEGER NOT NULL,
          type TEXT NOT NULL DEFAULT 'milk',
          litres REAL NOT NULL,
          rate REAL NOT NULL,
          total REAL NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'pending',
          sale_date DATE DEFAULT CURRENT_DATE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (consumerId) REFERENCES consumers(id)
        )
      `, (err) => {
        if (err) console.error("Consumer sales table creation error:", err.message);
      });

      // Create consumer_payments table for payments from consumers
      db.run(`
        CREATE TABLE IF NOT EXISTS consumer_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          consumerId INTEGER NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          payment_method TEXT DEFAULT 'cash',
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (consumerId) REFERENCES consumers(id)
        )
      `, (err) => {
        if (err) console.error("Consumer payments table creation error:", err.message);
      });

      // Create inventory table to track milk stock
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          opening_stock REAL NOT NULL DEFAULT 0,
          received REAL NOT NULL DEFAULT 0,
          sold REAL NOT NULL DEFAULT 0,
          closing_stock REAL NOT NULL DEFAULT 0,
          date DATE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error("Inventory table creation error:", err.message);
      });
    }
  });

  // Make db globally accessible
  global.db = db;

  const PORT = process.env.PORT || 5000;
  startServer(PORT);
}

// Start server
function startServer(port) {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// ========================
// AUTHENTICATION
// ========================

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ JWT_SECRET is required in production.");
    process.exit(1);
  }
  console.warn("⚠️ JWT_SECRET is not set. Authentication tokens are insecure in this environment.");
}

app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========================
// API ROUTES
// ========================

app.use("/api/clients", authenticate, requireCsrf, clientRoutes);
console.log("Mounting /api/milk routes");
app.use("/api/milk", authenticate, requireCsrf, milkRoutes);
app.use("/api/settlements", authenticate, requireCsrf, settlementRoutes);
app.use("/api/payments", authenticate, requireCsrf, paymentRoutes);
app.use("/api/advances", authenticate, requireCsrf, advanceRoutes);
app.use("/api/consumers", authenticate, requireCsrf, consumerRoutes);
app.use("/api/consumer-sales", authenticate, requireCsrf, consumerSalesRoutes);
app.use("/api/consumer-payments", authenticate, requireCsrf, consumerPaymentRoutes);
app.use("/api/inventory", authenticate, requireCsrf, inventoryRoutes);

app.get("/ping", (req, res) => {
  res.send("pong");
});

module.exports = app;
