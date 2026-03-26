const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// Protected: add product (image URL already uploaded from frontend)
router.post("/add", auth, async (req, res) => {
  try {
    const { name, price, shopId, image } = req.body;
    if (!name || !price || !shopId || !image)
      return res.status(400).json("All fields are required");

    const product = new Product({ name, price, shopId, image });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
// Public: search products globally (fuzzy search with patterns)
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    // Case-insensitive "fuzzy" regex match
    const products = await Product.find({
      name: { $regex: q, $options: "i" }
    }).populate("shopId", "name address location"); // Staple shop name, address, and location

    res.json(products);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Public: get products by shop
router.get("/:shopId", async (req, res) => {
  try {
    if (!req.params.shopId.match(/^[0-9a-fA-F]{24}$/)) return res.json([]);
    const products = await Product.find({ shopId: req.params.shopId });
    res.json(products);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: delete product
router.delete("/:id", auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: edit product
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, image },
      { returnDocument: 'after' }
    );
    if (!updatedProduct) return res.status(404).json("Product not found");
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Protected: toggle product availability
router.patch("/:id/availability", auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { returnDocument: 'after' }
    );
    if (!updatedProduct) return res.status(404).json("Product not found");
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
