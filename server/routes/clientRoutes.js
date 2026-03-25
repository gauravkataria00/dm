const express = require("express");
const router = express.Router();
const Client = require("../models/Client");

// Validation helper
const validatePhoneNumber = (phone) => /^\d{10}$/.test(phone);

// Get all clients with pagination
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments({ userId })
    ]);

    res.json({
      data: clients.map(client => ({
        id: client._id,
        name: client.name,
        phone: client.phone,
        address: client.address || "",
        createdAt: client.createdAt
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET /clients error:", error.message);
    res.status(500).json({ error: "Failed to fetch clients", details: error.message });
  }
});

// Get single client
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user.id });
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    res.json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      address: client.address || "",
      createdAt: client.createdAt
    });
  } catch (error) {
    console.error("GET /clients/:id error:", error.message);
    res.status(500).json({ error: "Failed to fetch client", details: error.message });
  }
});

// Create new client
router.post("/", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: "Client name must be at least 2 characters" });
    }
    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({ error: "Phone must be a valid 10-digit number" });
    }

    const client = new Client({
      userId: req.user.id,
      name: name.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : ""
    });

    await client.save();

    res.status(201).json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      address: client.address || "",
      createdAt: client.createdAt
    });
  } catch (error) {
    console.error("POST /clients error:", error.message);
    
    // Handle duplicate phone
    if (error.code === 11000) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
    
    res.status(500).json({ error: "Failed to create client", details: error.message });
  }
});

// Update client
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Validation
    if (name && (typeof name !== 'string' || name.trim().length < 2)) {
      return res.status(400).json({ error: "Client name must be at least 2 characters" });
    }
    if (phone && !validatePhoneNumber(phone)) {
      return res.status(400).json({ error: "Phone must be a valid 10-digit number" });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address ? address.trim() : "";

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      address: client.address || "",
      createdAt: client.createdAt
    });
  } catch (error) {
    console.error("PUT /clients/:id error:", error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
    
    res.status(500).json({ error: "Failed to update client", details: error.message });
  }
});

// Delete client
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("DELETE /clients/:id error:", error.message);
    res.status(500).json({ error: "Failed to delete client", details: error.message });
  }
});

module.exports = router;