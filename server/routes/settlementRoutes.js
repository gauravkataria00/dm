const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all settlements with client names
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT s.*, c.name AS clientName
    FROM settlements s
    LEFT JOIN clients c ON s.clientId = c.id
    ORDER BY s.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get settlements for a specific client
router.get("/client/:clientId", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId } = req.params;

  const query = `
    SELECT s.*, c.name AS clientName
    FROM settlements s
    LEFT JOIN clients c ON s.clientId = c.id
    WHERE s.clientId = ?
    ORDER BY s.createdAt DESC
  `;

  db.all(query, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a new settlement for a client (calculate for a period)
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId, startDate, endDate } = req.body;

  if (!clientId || !startDate || !endDate) {
    return res.status(400).json({ error: "clientId, startDate, and endDate are required" });
  }

  // Calculate total milk and amount for the period
  const milkQuery = `
    SELECT SUM(litres) as totalLitres, SUM(total) as totalAmount
    FROM milk_entries
    WHERE clientId = ? AND DATE(createdAt) BETWEEN DATE(?) AND DATE(?)
  `;

  db.get(milkQuery, [clientId, startDate, endDate], (err, milkData) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalLitres = milkData.totalLitres || 0;
    const totalAmount = milkData.totalAmount || 0;

    // Insert settlement
    const insertQuery = `
      INSERT INTO settlements (clientId, startDate, endDate, totalLitres, totalAmount, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    db.run(insertQuery, [clientId, startDate, endDate, totalLitres, totalAmount], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Return the created settlement with client name
      const selectQuery = `
        SELECT s.*, c.name AS clientName
        FROM settlements s
        LEFT JOIN clients c ON s.clientId = c.id
        WHERE s.id = ?
      `;

      db.get(selectQuery, [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    });
  });
});

// Update settlement status
router.put("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  db.run(
    "UPDATE settlements SET status = ? WHERE id = ?",
    [status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Settlement not found" });
      }

      res.json({ message: "Settlement updated successfully" });
    }
  );
});

module.exports = router;