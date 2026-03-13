const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all consumer sales
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT cs.*, c.name AS consumerName
    FROM consumer_sales cs
    LEFT JOIN consumers c ON cs.consumerId = c.id
    ORDER BY cs.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get sales for a specific consumer
router.get("/consumer/:consumerId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { consumerId } = req.params;

  const query = `
    SELECT cs.*, c.name AS consumerName
    FROM consumer_sales cs
    LEFT JOIN consumers c ON cs.consumerId = c.id
    WHERE cs.consumerId = ?
    ORDER BY cs.createdAt DESC
  `;

  db.all(query, [consumerId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get today's sales
router.get("/today", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT cs.*, c.name AS consumerName
    FROM consumer_sales cs
    LEFT JOIN consumers c ON cs.consumerId = c.id
    WHERE DATE(cs.createdAt) = DATE(?)
    ORDER BY cs.createdAt DESC
  `;

  db.all(query, [today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new consumer sale
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { consumer_id, quantity, price_per_liter, total_amount, payment_status, sale_date } = req.body;

  if (!consumer_id || !quantity || !price_per_liter || !total_amount) {
    return res.status(400).json({ error: "consumer_id, quantity, price_per_liter, and total_amount are required" });
  }

  const stmt = db.prepare(
    `INSERT INTO consumer_sales (consumerId, type, litres, rate, total, payment_status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run([consumer_id, 'milk', quantity, price_per_liter, total_amount, payment_status || 'pending', sale_date || new Date().toISOString()], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const selectQuery = `
      SELECT cs.*, c.name AS consumerName
      FROM consumer_sales cs
      LEFT JOIN consumers c ON cs.consumerId = c.id
      WHERE cs.id = ?
    `;

    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Update sale payment status
router.put("/:id/status", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;
  const { payment_status } = req.body;

  if (!payment_status) {
    return res.status(400).json({ error: "payment_status is required" });
  }

  db.run(
    "UPDATE consumer_sales SET payment_status = ? WHERE id = ?",
    [payment_status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      res.json({ message: "Sale status updated successfully" });
    }
  );
});

// Get sales summary for a date range
router.get("/summary/range", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  const query = `
    SELECT
      COUNT(*) as totalSales,
      SUM(litres) as totalLitres,
      SUM(total) as totalRevenue,
      SUM(CASE WHEN payment_status = 'pending' THEN total ELSE 0 END) as pendingAmount,
      SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as paidAmount
    FROM consumer_sales
    WHERE DATE(createdAt) BETWEEN DATE(?) AND DATE(?)
  `;

  db.get(query, [startDate, endDate], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {
      totalSales: 0,
      totalLitres: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0
    });
  });
});

module.exports = router;