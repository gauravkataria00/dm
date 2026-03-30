const express = require("express");
const router = express.Router();
const Client = require("../models/Client");

const scopedFilter = (req, extra = {}) => {
  const adminId = req.user.id;
  return {
    adminId,
    ...extra,
  };
};

router.get("/", async (req, res) => {
  try {
    const clients = await Client.find(scopedFilter(req)).sort({ _id: -1 }).lean();
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
    const client = await Client.findOne(scopedFilter(req, { _id: req.params.id })).lean();
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
    const { tenantId, id } = req.user;
    const adminId = id;
    const { name, phone } = req.body;
    const client = new Client({ tenantId, adminId, name, phone });
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
    const client = await Client.findOneAndUpdate(
      scopedFilter(req, { _id: req.params.id }),
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
    await Client.findOneAndDelete(scopedFilter(req, { _id: req.params.id }));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;