import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express, { json } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = 3000;
// Add your secret key in the .env file as SECRET_KEY
const JWT_SECRET = process.env.SECRET_KEY;
// Add special admin code in the .env file as ADMIN_CODE
const ADMIN_CODE = process.env.ADMIN_CODE;

app.use(json());

// MongoDB connection
// Add your MongoDB connection string in the .env file as MONGODB_URI
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema & Model with role
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

// Routes
// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Decide role: only allow admin creation if correct ADMIN_CODE provided
    let role = "user";
    if (adminCode && ADMIN_CODE && adminCode === ADMIN_CODE) {
      role = "admin";
    }

    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully.", role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed." });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Admin-only route
app.get("/admin", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only." });
    }

    res.json({ message: "Admin route accessed successfully." });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
