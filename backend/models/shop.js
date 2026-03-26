const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  openingTime: { type: String, default: "09:00" },
  closingTime: { type: String, default: "22:00" },
  isManuallyClosed: { type: Boolean, default: false },
});

// sparse: true means the index only applies to docs that have the field
shopSchema.index({ location: "2dsphere" }, { sparse: true });

module.exports = mongoose.model("Shop", shopSchema);

