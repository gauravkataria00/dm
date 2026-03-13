const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `
    SELECT m.id, m.clientId, c.name AS clientName, m.type, m.litres, m.fat, m.snf, m.rate, m.total, m.createdAt
    FROM milk_entries m
    LEFT JOIN clients c ON m.clientId = c.id
    ORDER BY m.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { clientId, type, litres, fat, snf, rate, total } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const stmt = db.prepare(
    `INSERT INTO milk_entries (clientId, type, litres, fat, snf, rate, total) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run([clientId, type, litres, fat, snf, rate, total], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get(
      `
      SELECT m.id, m.clientId, c.name AS clientName, m.type, m.litres, m.fat, m.snf, m.rate, m.total, m.createdAt
      FROM milk_entries m
      LEFT JOIN clients c ON m.clientId = c.id
      WHERE m.id = ?
    `,
      [this.lastID],
      (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(row);
      }
    );
  });

  if (stmt.finalize) stmt.finalize();
});

module.exports = router;
