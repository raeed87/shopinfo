require("dotenv").config();
const mongoose = require("mongoose");
const Merchant = require("./models/Merchant");
const Shop = require("./models/shop");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const merchants = await Merchant.find();
    const shops = await Shop.find();
    
    console.log("=== MERCHANTS ===", merchants.length);
    merchants.forEach(m => console.log(` - ${m.email} | _id: ${m._id}`));

    console.log("\n=== SHOPS ===", shops.length);
    shops.forEach(s => console.log(` - name: "${s.name}" | merchantId: ${s.merchantId}`));

    if (merchants.length > 0 && shops.length > 0) {
      // Cross-reference
      for (const m of merchants) {
        const match = shops.find(s => s.merchantId.toString() === m._id.toString());
        console.log(`\nMerchant ${m.email} => Shop match: ${match ? match.name : "NONE (orphaned!)"}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
