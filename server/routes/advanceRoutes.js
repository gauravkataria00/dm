const express = require("express");
const router = express.Router();
const Advance = require("../models/Advance");

// Get all advances with client names
router.get("/", async (req, res) => {
  try {
    const advances = await Advance.find().populate('clientId', 'name').sort({ createdAt: -1 });
    res.json(advances.map(advance => ({
      id: advance._id,
      clientId: advance.clientId._id,
      clientName: advance.clientId.name,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get advances for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    const advances = await Advance.find({ clientId: req.params.clientId }).populate('clientId', 'name').sort({ createdAt: -1 });
    res.json(advances.map(advance => ({
      id: advance._id,
      clientId: advance.clientId._id,
      clientName: advance.clientId.name,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new advance
router.post("/", async (req, res) => {
  try {
    const { clientId, amount, date, purpose } = req.body;

    if (!clientId || !amount || !date) {
      return res.status(400).json({ error: "clientId, amount, and date are required" });
    }

    const advance = new Advance({ clientId, amount, date, purpose, status: 'active' });
    await advance.save();
    await advance.populate('clientId', 'name');

    res.json({
      id: advance._id,
      clientId: advance.clientId._id,
      clientName: advance.clientId.name,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update advance status (when repaid)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const advance = await Advance.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!advance) {
      return res.status(404).json({ error: "Advance not found" });
    }

    res.json({ message: "Advance updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;