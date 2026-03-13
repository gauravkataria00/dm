const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available. Falls back to empty responses.

router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  db.all("SELECT id, name, phone, createdAt FROM clients ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const id = req.params.id;
  db.get("SELECT id, name, phone, createdAt FROM clients WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const { name, phone } = req.body;
  const stmt = db.prepare("INSERT INTO clients (name, phone) VALUES (?, ?)");
  stmt.run([name, phone], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT id, name, phone, createdAt FROM clients WHERE id = ?", [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(row);
    });
  });
  stmt.finalize && stmt.finalize();
});

router.put("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const { name, phone } = req.body;
  const id = req.params.id;
  db.run("UPDATE clients SET name = ?, phone = ? WHERE id = ?", [name, phone, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT id, name, phone, createdAt FROM clients WHERE id = ?", [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(row);
    });
  });
});

router.delete("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const id = req.params.id;
  db.run("DELETE FROM clients WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;