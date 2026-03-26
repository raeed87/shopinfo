const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // Cloudinary URL
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model("Product", productSchema, "products");
