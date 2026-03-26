const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("Merchant", merchantSchema);
