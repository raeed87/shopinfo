const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Merchant = require("../models/Merchant");
const Shop = require("../models/shop");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, shopName, category, phone, address, location } = req.body;

    // Validate essential fields
    if (!name || !email || !password || !shopName || !category || !phone) {
      return res.status(400).json("Please fill out all required merchant and shop fields.");
    }

    const existing = await Merchant.findOne({ email });
    if (existing) return res.status(400).json("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create instances first without saving
    const merchant = new Merchant({
      name,
      email,
      password: hashedPassword,
    });

    const shopData = {
      merchantId: merchant._id,
      name: shopName,
      category,
      phone,
      address,
    };
    // Only add location if coordinates are actually provided
    if (location && location.coordinates && location.coordinates.length === 2) {
      shopData.location = location;
    }
    const shop = new Shop(shopData);

    // Save both only if creation instantiated correctly
    await merchant.save();
    try {
      await shop.save();
    } catch (shopErr) {
      // Rollback if shop fails
      await Merchant.findByIdAndDelete(merchant._id);
      return res.status(400).json("Shop validation failed: " + shopErr.message);
    }

    res.json({ message: "Account and Shop created" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ email: req.body.email });
    if (!merchant) return res.status(400).json("User not found");

    const isMatch = await bcrypt.compare(req.body.password, merchant.password);
    if (!isMatch) return res.status(400).json("Wrong password");

    const token = jwt.sign({ id: merchant._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, name: merchant.name });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
