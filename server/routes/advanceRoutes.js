const express = require("express");
const router = express.Router();
const Advance = require("../models/Advance");
const Client = require("../models/Client");

// Get all advances with client names
router.get("/", async (req, res) => {
  try {
    const { tenantId } = req.user;
    let advances = await Advance.find({ tenantId })
      .populate('clientId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();
    
    // Remove broken references
    advances = advances.filter(advance => advance.clientId !== null);
    
    // Safe response format
    const data = advances.map(advance => ({
      id: advance._id,
      _id: advance._id,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt,
      client: {
        name: advance.clientId?.name || "Unknown",
        phone: advance.clientId?.phone || "N/A"
      },
      clientName: advance.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Advances GET error:", error.message);
    res.json([]); // never crash
  }
});

// Get advances for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    const { tenantId } = req.user;
    let advances = await Advance.find({ tenantId, clientId: req.params.clientId })
      .populate('clientId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();
    
    // Remove broken references
    advances = advances.filter(advance => advance.clientId !== null);
    
    // Safe response format
    const data = advances.map(advance => ({
      id: advance._id,
      _id: advance._id,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt,
      client: {
        name: advance.clientId?.name || "Unknown",
        phone: advance.clientId?.phone || "N/A"
      },
      clientName: advance.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Advances GET/client error:", error.message);
    res.json([]); // never crash
  }
});

// Add a new advance
router.post("/", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, amount, date, purpose } = req.body;

    if (!clientId || !amount || !date) {
      return res.status(400).json({ error: "clientId, amount, and date are required" });
    }

    // Validate that client exists before saving
    const client = await Client.findOne({ _id: clientId, tenantId });
    if (!client) {
      console.error(`Invalid clientId: ${clientId}`);
      return res.status(400).json({ error: "Invalid client" });
    }

    const advance = new Advance({ tenantId, clientId, amount, date, purpose, status: 'active' });
    await advance.save();
    await advance.populate('clientId', 'name phone');

    res.json({
      id: advance._id,
      _id: advance._id,
      amount: advance.amount,
      date: advance.date,
      purpose: advance.purpose,
      status: advance.status,
      createdAt: advance.createdAt,
      client: {
        name: advance.clientId?.name || "Unknown",
        phone: advance.clientId?.phone || "N/A"
      },
      clientName: advance.clientId?.name || "Unknown" // backward compatibility
    });
  } catch (error) {
    console.error("Advance POST error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update advance status (when repaid)
router.put("/:id", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const advance = await Advance.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { status },
      { new: true }
    );
    if (!advance) {
      return res.status(404).json({ error: "Advance not found" });
    }

    console.log(`Advance ${req.params.id} updated to status: ${status}`);
    res.json({ message: "Advance updated successfully" });
  } catch (error) {
    console.error("Advance PUT error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;