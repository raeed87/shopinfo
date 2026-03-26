require("dotenv").config();
const mongoose = require("mongoose");
const Shop = require("./models/shop");
const Merchant = require("./models/Merchant");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    console.log("Testing shop creation...");
    
    // Create a test merchant  
    const hashed = await bcrypt.hash("testpass", 10);
    const merchant = new Merchant({ name: "Test", email: `diag${Date.now()}@test.com`, password: hashed });
    await merchant.save();
    console.log("Merchant saved:", merchant._id);

    // Try creating shop without location
    const shopData = {
      merchantId: merchant._id,
      name: "My Test Shop",
      category: "Food",
      phone: "9999999999",
      address: "Test Address",
    };
    
    const shop = new Shop(shopData);
    await shop.save();
    console.log("Shop saved successfully:", shop._id);
    
    // Cleanup
    await Merchant.findByIdAndDelete(merchant._id);
    await Shop.findByIdAndDelete(shop._id);
    console.log("Cleaned up. Test PASSED ✅");
    
  } catch (err) {
    console.error("Test FAILED ❌:", err.message);
  } finally {
    process.exit(0);
  }
});
