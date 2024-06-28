require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Allowed origins
const allowedOrigins = ["http://example1.com", "http://example2.com", "*"];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Check if the origin is in the allowed origins list or if "*" is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// CORS middleware
app.use(cors(corsOptions));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Define a Mongoose schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// GET endpoint
app.get("/api/users", async (req, res) => {
  try {
    const resources = await User.find();
    res.status(200).json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST endpoint
app.post("/api/users", async (req, res) => {
  try {
    const resource = new User(req.body);
    const savedResource = await resource.save();
    res.status(201).json(savedResource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT endpoint
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedResource = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.status(200).json(updatedResource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE endpoint
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResource = await User.findByIdAndDelete(id);
    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.status(200).json({ message: `Resource with ID ${id} deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
