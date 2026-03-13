const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all consumers
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `SELECT * FROM consumers ORDER BY createdAt DESC`;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single consumer by ID
router.get("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;

  db.get("SELECT * FROM consumers WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Consumer not found" });
    res.json(row);
  });
});

// Create new consumer
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { name, phone, address, type, credit_limit } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Consumer name is required" });
  }

  const stmt = db.prepare(
    `INSERT INTO consumers (name, phone, address, type, credit_limit) VALUES (?, ?, ?, ?, ?)`
  );

  stmt.run([name, phone, address, type || 'regular', credit_limit || 0], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get("SELECT * FROM consumers WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Update consumer
router.put("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;
  const { name, phone, address, type, credit_limit } = req.body;

  db.run(
    "UPDATE consumers SET name = ?, phone = ?, address = ?, type = ?, credit_limit = ? WHERE id = ?",
    [name, phone, address, type, credit_limit, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Consumer not found" });
      }

      db.get("SELECT * FROM consumers WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// Delete consumer
router.delete("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;

  db.run("DELETE FROM consumers WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: "Consumer not found" });
    }

    res.json({ message: "Consumer deleted successfully" });
  });
});

// Get consumer payment summary
router.get("/:id/summary", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;

  // Calculate total owed, paid, and pending amounts
  const queries = {
    totalOwed: `SELECT SUM(total) as amount FROM consumer_sales WHERE consumerId = ?`,
    totalPaid: `SELECT SUM(amount) as amount FROM consumer_payments WHERE consumerId = ?`,
    pendingSales: `SELECT SUM(total) as amount FROM consumer_sales WHERE consumerId = ? AND payment_status = 'pending'`
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.totalOwed, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.amount || 0 : 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.totalPaid, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.amount || 0 : 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.pendingSales, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.amount || 0 : 0);
      });
    })
  ]).then(([totalOwed, totalPaid, pendingSales]) => {
    const outstanding = totalOwed - totalPaid;

    res.json({
      consumerId: parseInt(id),
      totalOwed,
      totalPaid,
      outstanding,
      pendingSales,
      status: outstanding > 0 ? 'has_balance' : 'settled'
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

module.exports = router;