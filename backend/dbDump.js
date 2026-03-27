const fs = require('fs');
require("dotenv").config();
const mongoose = require("mongoose");
const Merchant = require("./models/Merchant");

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    try {
        const merchants = await Merchant.find();
        fs.writeFileSync('merchant_dump.json', JSON.stringify(merchants, null, 2));
        console.log("Success");
    } catch(err) {
        console.log("Error:", err.message);
    } finally {
        process.exit(0);
    }
});
