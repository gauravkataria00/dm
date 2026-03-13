const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all payments with client and settlement info
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT p.*, c.name AS clientName, s.startDate, s.endDate
    FROM payments p
    LEFT JOIN clients c ON p.clientId = c.id
    LEFT JOIN settlements s ON p.settlementId = s.id
    ORDER BY p.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get payments for a specific client
router.get("/client/:clientId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId } = req.params;

  const query = `
    SELECT p.*, c.name AS clientName, s.startDate, s.endDate
    FROM payments p
    LEFT JOIN clients c ON p.clientId = c.id
    LEFT JOIN settlements s ON p.settlementId = s.id
    WHERE p.clientId = ?
    ORDER BY p.createdAt DESC
  `;

  db.all(query, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new payment
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId, settlementId, amount, type, date, notes } = req.body;

  if (!clientId || !amount || !type || !date) {
    return res.status(400).json({ error: "clientId, amount, type, and date are required" });
  }

  const stmt = db.prepare(
    `INSERT INTO payments (clientId, settlementId, amount, type, date, notes) VALUES (?, ?, ?, ?, ?, ?)`
  );

  stmt.run([clientId, settlementId, amount, type, date, notes], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Return the created payment with client name
    const selectQuery = `
      SELECT p.*, c.name AS clientName, s.startDate, s.endDate
      FROM payments p
      LEFT JOIN clients c ON p.clientId = c.id
      LEFT JOIN settlements s ON p.settlementId = s.id
      WHERE p.id = ?
    `;

    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Get client payment summary (total owed, paid, advances, etc.)
router.get("/summary/:clientId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId } = req.params;

  // Calculate various totals for the client
  const queries = {
    totalEarned: `
      SELECT SUM(total) as amount FROM milk_entries WHERE clientId = ?
    `,
    totalPaid: `
      SELECT SUM(amount) as amount FROM payments
      WHERE clientId = ? AND type IN ('settlement_payment', 'advance_repaid')
    `,
    advancesGiven: `
      SELECT SUM(amount) as amount FROM advances
      WHERE clientId = ? AND status = 'active'
    `,
    advancesRepaid: `
      SELECT SUM(amount) as amount FROM payments
      WHERE clientId = ? AND type = 'advance_repaid'
    `,
    pendingSettlements: `
      SELECT SUM(totalAmount) as amount FROM settlements
      WHERE clientId = ? AND status = 'pending'
    `
  };

  const results = {};

  const executeQuery = (key, query, params) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.amount || 0 : 0);
      });
    });
  };

  Promise.all([
    executeQuery('totalEarned', queries.totalEarned, [clientId]),
    executeQuery('totalPaid', queries.totalPaid, [clientId]),
    executeQuery('advancesGiven', queries.advancesGiven, [clientId]),
    executeQuery('advancesRepaid', queries.advancesRepaid, [clientId]),
    executeQuery('pendingSettlements', queries.pendingSettlements, [clientId])
  ]).then(([totalEarned, totalPaid, advancesGiven, advancesRepaid, pendingSettlements]) => {
    const netOutstanding = totalEarned - totalPaid - advancesRepaid + advancesGiven;

    res.json({
      clientId: parseInt(clientId),
      totalEarned,
      totalPaid,
      advancesGiven,
      advancesRepaid,
      pendingSettlements,
      netOutstanding,
      status: netOutstanding > 0 ? 'owed_to_client' : netOutstanding < 0 ? 'client_owes' : 'settled'
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

module.exports = router;