const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

async function testSearch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const query = "charge";
    const products = await Product.find({
      name: { $regex: query, $options: "i" }
    }).populate("shopId", "name address");

    console.log(`Found ${products.length} products for query "${query}":`);
    console.log(JSON.stringify(products, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testSearch();
