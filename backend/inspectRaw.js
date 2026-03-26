const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

async function inspectRaw() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const raw = await mongoose.connection.db.collection("products").find({}).toArray();
    console.log("Raw documents in 'products' collection:");
    console.log(JSON.stringify(raw, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectRaw();
