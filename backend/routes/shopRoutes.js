const express = require("express");
const router = express.Router();
const Shop = require("../models/shop");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// Public: get all shops (with search + product-link search)
router.get("/", async (req, res) => {
  const { search, category } = req.query;
  let query = {};

  if (search) {
    // Phase 2: Also find shops that sell products matching this search
    const shopsByProducts = await Product.find({
      name: { $regex: search, $options: "i" }
    }).distinct("shopId");

    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { _id: { $in: shopsByProducts } },
    ];
  }

  if (category && category !== "All") {
    query.category = { $regex: `^${category}$`, $options: "i" };
  }

  const shops = await Shop.find(query);
  res.json(shops);
});

// Public: nearby shops
router.get("/nearby", async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 5000,
        },
      },
    });
    res.json(shops);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: toggle manual shop status
// MOVED UP to ensure priority and avoid conflict with ID routes
router.put("/merchant/my/status", auth, async (req, res) => {
  try {
    const { isManuallyClosed } = req.body;
    console.log("Toggling status for merchant:", req.user.id, "to", isManuallyClosed);
    const shop = await Shop.findOneAndUpdate(
      { merchantId: req.user.id },
      { isManuallyClosed },
      { returnDocument: "after" }
    );
    if (!shop) return res.status(404).json("Shop not found");
    res.json(shop);
  } catch (err) {
    console.error("Status Toggle Error:", err);
    res.status(500).json(err.message);
  }
});

// Protected: get merchant's own single shop
router.get("/merchant/my", auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.user.id }).sort({ _id: -1 });
    res.json(shop || null);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: create shop (only if merchant has none)
router.post("/add", auth, async (req, res) => {
  try {
    const shops = await Shop.find({ merchantId: req.user.id }).sort({ _id: -1 });
    if (shops.length > 0) {
      const idsToDelete = shops.slice(1).map(s => s._id);
      if (idsToDelete.length > 0) await Shop.deleteMany({ _id: { $in: idsToDelete } });
      return res.status(400).json("You already have a shop. Edit it instead.");
    }
    const shop = new Shop({ ...req.body, merchantId: req.user.id });
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: edit own shop
router.put("/merchant/my", auth, async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { merchantId: req.user.id },
      req.body,
      { returnDocument: 'after' }
    );
    if (!shop) return res.status(404).json("Shop not found");
    res.json(shop);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: delete own shop
router.delete("/merchant/my", auth, async (req, res) => {
  try {
    await Shop.findOneAndDelete({ merchantId: req.user.id });
    res.json({ message: "Shop deleted" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Public: get single shop by id
router.get("/:id", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    res.json(shop);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
