const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "dairyDB.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to open database:", err.message);
    process.exit(1);
  }
});

const tables = [
  "clients",
  "milk_entries",
  "settlements",
  "payments",
  "advances",
  "consumer_sales",
  "inventory",
];

const runDelete = (table) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table}`, function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

(async () => {
  try {
    console.log("Resetting database tables (deleting all rows)...");

    for (const table of tables) {
      const deleted = await runDelete(table);
      console.log(`- Cleared ${deleted} rows from ${table}`);
    }

    console.log("✅ Database reset complete.\nRestart your server to start with a clean state.");
  } catch (err) {
    console.error("❌ Failed to reset database:", err);
  } finally {
    db.close();
  }
})();
