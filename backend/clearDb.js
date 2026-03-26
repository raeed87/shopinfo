require("dotenv").config();
const mongoose = require("mongoose");
const Merchant = require("./models/Merchant");
const Shop = require("./models/shop");
const Product = require("./models/Product");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB. Clearing merchant data...");
  const merchantCount = await Merchant.deleteMany({});
  const shopCount = await Shop.deleteMany({});
  const productCount = await Product.deleteMany({});
  
  console.log(`Successfully deleted:
- ${merchantCount.deletedCount} Merchants
- ${shopCount.deletedCount} Shops
- ${productCount.deletedCount} Products`);
  
  process.exit(0);
}).catch(err => {
  console.error("Database connection error:", err);
  process.exit(1);
});
