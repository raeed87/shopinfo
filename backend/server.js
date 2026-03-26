require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// Flexible CORS to support local dev and decoupled Vercel deployments
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Future Vercel/Netlify URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
}));
const path = require("path");
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Health check for Render
app.get("/health", (req, res) => res.status(200).send("OK"));

// CRITICAL: Disable aggressive caching for API routes so live DB updates show instantly!
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/shops", require("./routes/shopRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// --- PRODUCTION CONFIG ---
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  // Fallback for React Router: serve index.html for any unknown requests
  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("API is running..."));
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (binding to 0.0.0.0)`);
});
