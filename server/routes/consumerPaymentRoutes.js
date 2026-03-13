const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all consumer payments
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT cp.*, c.name AS consumerName
    FROM consumer_payments cp
    LEFT JOIN consumers c ON cp.consumerId = c.id
    ORDER BY cp.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get payments for a specific consumer
router.get("/consumer/:consumerId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { consumerId } = req.params;

  const query = `
    SELECT cp.*, c.name AS consumerName
    FROM consumer_payments cp
    LEFT JOIN consumers c ON cp.consumerId = c.id
    WHERE cp.consumerId = ?
    ORDER BY cp.createdAt DESC
  `;

  db.all(query, [consumerId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new consumer payment
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { consumer_id, amount, payment_date, payment_method, notes } = req.body;

  if (!consumer_id || !amount || !payment_date) {
    return res.status(400).json({ error: "consumer_id, amount, and payment_date are required" });
  }

  const stmt = db.prepare(
    `INSERT INTO consumer_payments (consumerId, amount, date, payment_method, notes) VALUES (?, ?, ?, ?, ?)`
  );

  const notesText = notes;

  stmt.run([consumer_id, amount, payment_date, payment_method || 'cash', notesText], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const selectQuery = `
      SELECT cp.*, c.name AS consumerName
      FROM consumer_payments cp
      LEFT JOIN consumers c ON cp.consumerId = c.id
      WHERE cp.id = ?
    `;

    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Get payment summary for a consumer
router.get("/summary/:consumerId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { consumerId } = req.params;

  const query = `
    SELECT
      COUNT(*) as totalPayments,
      SUM(amount) as totalPaid,
      MAX(date) as lastPaymentDate
    FROM consumer_payments
    WHERE consumerId = ?
  `;

  db.get(query, [consumerId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {
      totalPayments: 0,
      totalPaid: 0,
      lastPaymentDate: null
    });
  });
});

module.exports = router;