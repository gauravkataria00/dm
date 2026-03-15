const express = require("express");
const router = express.Router();
const MilkEntry = require("../models/MilkEntry");
const Client = require("../models/Client");

router.get("/", async (req, res) => {
  try {
    const milkEntries = await MilkEntry.find().populate('clientId', 'name').sort({ createdAt: -1 });
    res.json(milkEntries.map(entry => ({
      id: entry._id,
      clientId: entry.clientId._id,
      clientName: entry.clientId.name,
      type: entry.type,
      litres: entry.litres,
      fat: entry.fat,
      snf: entry.snf,
      rate: entry.rate,
      total: entry.total,
      createdAt: entry.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clientId, type, litres, fat, snf, rate, total } = req.body;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    const milkEntry = new MilkEntry({ clientId, type, litres, fat, snf, rate, total });
    await milkEntry.save();

    await milkEntry.populate('clientId', 'name');
    res.json({
      id: milkEntry._id,
      clientId: milkEntry.clientId._id,
      clientName: milkEntry.clientId.name,
      type: milkEntry.type,
      litres: milkEntry.litres,
      fat: milkEntry.fat,
      snf: milkEntry.snf,
      rate: milkEntry.rate,
      total: milkEntry.total,
      createdAt: milkEntry.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
