const express = require("express");
const router = express.Router();
const Client = require("../models/Client");

router.get("/", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const clients = await Client.find({ tenantId }).sort({ _id: -1 }).lean();
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
    const { tenantId } = req.user;
    const client = await Client.findOne({ _id: req.params.id, tenantId }).lean();
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
    const { tenantId } = req.user;
    const { name, phone } = req.body;
    const client = new Client({ tenantId, name, phone });
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
    const { tenantId } = req.user;
    const { name, phone } = req.body;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, phone },
      { new: true }
    );
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
    const { tenantId } = req.user;
    await Client.findOneAndDelete({ _id: req.params.id, tenantId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;