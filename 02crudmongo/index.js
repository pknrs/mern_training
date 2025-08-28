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
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const Todo = mongoose.model("Todo", todoSchema);

// Routes
// Create todo
app.post("/todos", async (req, res) => {
  try {
    const { text, completed } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const newTodo = new Todo({ text, completed });
    await newTodo.save();

    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create todo." });
  }
});

// Get all todos
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos." });
  }
});

// Get single todo by ID
app.get("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (todo) {
      res.json(todo);
    } else {
      res.status(404).json({ error: "Todo not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid todo ID." });
  }
});

// Update todo
app.put("/todos/:id", async (req, res) => {
  try {
    const { text, completed } = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { text, completed },
      { new: true, runValidators: true }
    );

    if (updatedTodo) {
      res.json(updatedTodo);
    } else {
      res.status(404).json({ error: "Todo not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid todo ID or data." });
  }
});

// Delete todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (deletedTodo) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Todo not found." });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid todo ID." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
