const mongoose = require("mongoose");
require("dotenv").config();

async function checkKeys() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const doc = await mongoose.connection.db.collection("products").findOne({});
    console.log("Keys in first document of 'products' collection:");
    console.log(Object.keys(doc));
    console.log("Full Document:");
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkKeys();
