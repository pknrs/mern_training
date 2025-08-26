import bcrypt from "bcryptjs";
import express, { json } from "express";
import jwt from "jsonwebtoken";
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
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

// Todo Schema (belongs to User)
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Todo = mongoose.model("Todo", todoSchema);

// Auth Routes
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Todo Routes
// Create Todo
app.post("/todos", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const todo = new Todo({ text, user: decoded.id });
    await todo.save();

    res.status(201).json(todo);
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// Get all todos for logged-in user
app.get("/todos", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const todos = await Todo.find({ user: decoded.id });
    res.json(todos);
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// Update Todo
app.put("/todos/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { text, completed } = req.body;
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: decoded.id },
      { text, completed },
      { new: true, runValidators: true }
    );

    if (!todo) return res.status(404).json({ error: "Todo not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: "Invalid request or token" });
  }
});

// Delete Todo
app.delete("/todos/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: decoded.id,
    });

    if (!todo) return res.status(404).json({ error: "Todo not found" });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Invalid request or token" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
