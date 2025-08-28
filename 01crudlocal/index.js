import express, { json } from "express";

const app = express();
const PORT = 3000;

app.use(json());

// In-memory todo store
let todoItems = [
  { id: 1, text: "Learn Express basics", completed: false },
  { id: 2, text: "Build a simple CRUD API", completed: true },
  { id: 3, text: "Practice MongoDB later", completed: false },
];

let nextId =
  todoItems.length > 0 ? Math.max(...todoItems.map((todo) => todo.id)) + 1 : 1;

// Create a new todo
app.post("/todos", (req, res) => {
  const newTodo = {
    id: nextId++,
    text: req.body.text,
    completed: req.body.completed ?? false,
  };

  if (!newTodo.text) {
    return res.status(400).json({ error: "Text is required." });
  }

  todoItems.push(newTodo);
  res.status(201).json(newTodo);
});

// Get all todos
app.get("/todos", (req, res) => {
  res.json(todoItems);
});

// Get a single todo by ID
app.get("/todos/:id", (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const todo = todoItems.find((t) => t.id === todoId);

  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ error: "Todo not found." });
  }
});

// Update a todo
app.put("/todos/:id", (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const todo = todoItems.find((t) => t.id === todoId);

  if (todo) {
    if (req.body.text !== undefined) {
      todo.text = req.body.text;
    }
    if (req.body.completed !== undefined) {
      todo.completed = req.body.completed;
    }
    res.json(todo);
  } else {
    res.status(404).json({ error: "Todo not found." });
  }
});

// Delete a todo
app.delete("/todos/:id", (req, res) => {
  const todoId = parseInt(req.params.id, 10);
  const todoIndex = todoItems.findIndex((t) => t.id === todoId);

  if (todoIndex !== -1) {
    todoItems.splice(todoIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: "Todo not found." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
