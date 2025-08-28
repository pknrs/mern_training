import dotenv from "dotenv";
import express, { json } from "express";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(json());

// MongoDB connection
// Add your MongoDB connection string in the .env file as MONGODB_URI
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose Schema & Model
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

const Item = mongoose.model("Item", itemSchema);

// Routes
// Create item
app.post("/items", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required." });
    }

    const newItem = new Item({ name, description });
    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item." });
  }
});

// Get all items
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items." });
  }
});

// Get single item by ID
app.get("/items/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Item not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid item ID." });
  }
});

// Update item
app.put("/items/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (updatedItem) {
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Item not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid item ID or data." });
  }
});

// Delete item
app.delete("/items/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (deletedItem) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Item not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid item ID." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
