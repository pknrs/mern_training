import express, { json } from "express";
import mongoose from "mongoose";

const app = express();
const PORT = 3000;
// Add your secret key in the .env file as SECRET_KEY
const JWT_SECRET = process.env.SECRET_KEY;

app.use(json());

// MongoDB connection
// Add your MongoDB connection string in the .env file as MONGODB_URI
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas & Models
// Todo Schema (belongs to User)
const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

// Todo Routes
// Create Todo
app.post("/todos", async (req, res) => {
  try {
    const { text, user } = req.body;
    const todo = new Todo({ text, user });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all todos with filter & sort
app.get("/todos", async (req, res) => {
  try {
    const { completed, sort } = req.query;

    // Filter
    let filter = {};
    if (completed !== undefined) {
      filter.completed = completed === "true";
    }

    // Sort
    let sortOption = { createdAt: -1 };
    if (sort === "asc") sortOption = { createdAt: 1 };
    if (sort === "desc") sortOption = { createdAt: -1 };

    const todos = await Todo.find(filter).sort(sortOption);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Todo
app.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { text, completed },
      { new: true }
    );

    if (!updatedTodo) return res.status(404).json({ error: "Todo not found" });

    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) return res.status(404).json({ error: "Todo not found" });

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
