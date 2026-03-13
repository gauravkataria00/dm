const express = require("express");
const router = express.Router();

// Uses global.db (sqlite) if available.

// Get all inventory records
router.get("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const query = `SELECT * FROM inventory ORDER BY date DESC, createdAt DESC`;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get inventory for a specific date
router.get("/date/:date", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { date } = req.params;

  const query = `SELECT * FROM inventory WHERE date = ? ORDER BY createdAt DESC`;

  db.all(query, [date], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get today's inventory
router.get("/today", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const today = new Date().toISOString().split('T')[0];

  const query = `SELECT * FROM inventory WHERE date = ? ORDER BY createdAt DESC`;

  db.all(query, [today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new inventory record
router.post("/", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { type, opening_stock, received, sold, closing_stock, date } = req.body;

  if (!type || !date) {
    return res.status(400).json({ error: "type and date are required" });
  }

  const stmt = db.prepare(
    `INSERT INTO inventory (type, opening_stock, received, sold, closing_stock, date) VALUES (?, ?, ?, ?, ?, ?)`
  );

  stmt.run([
    type,
    opening_stock || 0,
    received || 0,
    sold || 0,
    closing_stock || 0,
    date
  ], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get("SELECT * FROM inventory WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// Update inventory record
router.put("/:id", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const { id } = req.params;
  const { type, opening_stock, received, sold, closing_stock, date } = req.body;

  db.run(
    "UPDATE inventory SET type = ?, opening_stock = ?, received = ?, sold = ?, closing_stock = ?, date = ? WHERE id = ?",
    [type, opening_stock, received, sold, closing_stock, date, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: "Inventory record not found" });
      }

      db.get("SELECT * FROM inventory WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// Auto-calculate inventory for today based on milk entries and sales
router.post("/calculate/today", (req, res) => {
  const db = global.db;
  if (!db) return res.status(500).json({ error: "DB not initialized" });

  const today = new Date().toISOString().split('T')[0];

  // Get milk received today (from suppliers)
  const receivedQuery = `
    SELECT type, SUM(litres) as totalReceived
    FROM milk_entries
    WHERE DATE(createdAt) = DATE(?)
    GROUP BY type
  `;

  // Get milk sold today (to consumers)
  const soldQuery = `
    SELECT type, SUM(litres) as totalSold
    FROM consumer_sales
    WHERE DATE(createdAt) = DATE(?)
    GROUP BY type
  `;

  Promise.all([
    new Promise((resolve, reject) => {
      db.all(receivedQuery, [today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(soldQuery, [today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  ]).then(([receivedData, soldData]) => {
    // Get yesterday's closing stock
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayQuery = `SELECT * FROM inventory WHERE date = ?`;

    db.all(yesterdayQuery, [yesterdayStr], (err, yesterdayRecords) => {
      if (err) return res.status(500).json({ error: err.message });

      const inventoryRecords = [];

      // Process Cow milk
      const cowReceived = receivedData.find(r => r.type === 'Cow')?.totalReceived || 0;
      const cowSold = soldData.find(s => s.type === 'Cow')?.totalSold || 0;
      const cowYesterday = yesterdayRecords.find(y => y.type === 'Cow')?.closing_stock || 0;

      if (cowReceived > 0 || cowSold > 0 || cowYesterday > 0) {
        inventoryRecords.push({
          type: 'Cow',
          opening_stock: cowYesterday,
          received: cowReceived,
          sold: cowSold,
          closing_stock: cowYesterday + cowReceived - cowSold,
          date: today
        });
      }

      // Process Buffalo milk
      const buffaloReceived = receivedData.find(r => r.type === 'Buffalo')?.totalReceived || 0;
      const buffaloSold = soldData.find(s => s.type === 'Buffalo')?.totalSold || 0;
      const buffaloYesterday = yesterdayRecords.find(y => y.type === 'Buffalo')?.closing_stock || 0;

      if (buffaloReceived > 0 || buffaloSold > 0 || buffaloYesterday > 0) {
        inventoryRecords.push({
          type: 'Buffalo',
          opening_stock: buffaloYesterday,
          received: buffaloReceived,
          sold: buffaloSold,
          closing_stock: buffaloYesterday + buffaloReceived - buffaloSold,
          date: today
        });
      }

      // Insert inventory records
      const insertPromises = inventoryRecords.map(record => {
        return new Promise((resolve, reject) => {
          const stmt = db.prepare(
            `INSERT OR REPLACE INTO inventory (type, opening_stock, received, sold, closing_stock, date)
             VALUES (?, ?, ?, ?, ?, ?)`
          );

          stmt.run([
            record.type,
            record.opening_stock,
            record.received,
            record.sold,
            record.closing_stock,
            record.date
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      });

      Promise.all(insertPromises).then(() => {
        res.json({
          message: "Inventory calculated and updated successfully",
          records: inventoryRecords
        });
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

module.exports = router;