const fs = require('fs');
require("dotenv").config();
const mongoose = require("mongoose");
const Merchant = require("./models/Merchant");
const Shop = require("./models/shop");

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    try {
        const merchants = await Merchant.find();
        const shops = await Shop.find();
        
        let report = "--- DB REPORT ---\n";
        report += `Merchants: ${merchants.length}\n`;
        report += `Shops: ${shops.length}\n`;
        
        merchants.forEach(m => {
            const match = shops.find(s => s.merchantId.toString() === m._id.toString());
            report += `Merchant (${m.email}): Shop -> ${match ? match.name : "ORPHANED"}\n`;
        });
        
        fs.writeFileSync('db_report_out.txt', report);
        console.log("Success");
    } catch(err) {
        fs.writeFileSync('db_report_out.txt', "ERROR: " + err.message);
        console.log("Error saved");
    } finally {
        process.exit(0);
    }
}).catch(err => {
    fs.writeFileSync('db_report_out.txt', "CONN ERROR: " + err.message);
    console.log("Conn Error saved");
    process.exit(1);
});
