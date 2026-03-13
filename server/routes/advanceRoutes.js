const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all advances with client names
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT a.*, c.name AS clientName
    FROM advances a
    LEFT JOIN clients c ON a.clientId = c.id
    ORDER BY a.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get advances for a specific client
router.get("/client/:clientId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId } = req.params;

  const query = `
    SELECT a.*, c.name AS clientName
    FROM advances a
    LEFT JOIN clients c ON a.clientId = c.id
    WHERE a.clientId = ?
    ORDER BY a.createdAt DESC
  `;

  db.all(query, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new advance
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId, amount, date, purpose } = req.body;

  if (!clientId || !amount || !date) {
    return res.status(400).json({ error: "clientId, amount, and date are required" });
  }

  const stmt = db.prepare(
    `INSERT INTO advances (clientId, amount, date, purpose, status) VALUES (?, ?, ?, ?, 'active')`
  );

  stmt.run([clientId, amount, date, purpose], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Return the created advance with client name
    const selectQuery = `
      SELECT a.*, c.name AS clientName
      FROM advances a
      LEFT JOIN clients c ON a.clientId = c.id
      WHERE a.id = ?
    `;

    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Update advance status (when repaid)
router.put("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  db.run(
    "UPDATE advances SET status = ? WHERE id = ?",
    [status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Advance not found" });
      }

      res.json({ message: "Advance updated successfully" });
    }
  );
});

module.exports = router;