const mongoose = require("mongoose");
require("dotenv").config();

async function listProducts() {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Dynamic import to avoid capitalization issues in script
    const Product = require("./models/Product");
    const Shop = require("./models/shop");

    const products = await Product.find({});
    console.log(`Total products in database: ${products.length}`);
    
    if (products.length > 0) {
      for (const p of products) {
        const shop = await Shop.findById(p.shopId);
        console.log(`- [${p._id}] Name: "${p.name}", Price: ${p.price}, Shop: "${shop?.name || 'Unknown'}"`);
      }
    } else {
      console.log("No products found in the 'products' collection.");
    }

    process.exit(0);
  } catch (err) {
    console.error("DEBUG ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

listProducts();
