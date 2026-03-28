const express = require("express");
const router = express.Router();
const Client = require("../models/Client");

router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ _id: -1 }).lean();
    res.json(clients.map(client => ({
      id: client._id,
      name: client.name,
      phone: client.phone,
      createdAt: client.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      createdAt: client.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const client = new Client({ name, phone });
    await client.save();
    res.json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      createdAt: client.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const client = await Client.findByIdAndUpdate(req.params.id, { name, phone }, { new: true });
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      createdAt: client.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;