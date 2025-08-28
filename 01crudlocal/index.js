import express, { json } from "express";

const app = express();

const PORT = 3000;

app.use(json());

let items = [
  { id: 1, name: "Item A", description: "This is the first item." },
  { id: 2, name: "Item B", description: "This is the second item." },
  { id: 3, name: "Item C", description: "This is the third item." },
];
let nextId =
  items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

app.post("/items", (req, res) => {
  const newItem = {
    id: nextId++,
    name: req.body.name,
    description: req.body.description,
  };
  if (!newItem.name || !newItem.description) {
    return res
      .status(400)
      .json({ error: "Name and description are required." });
  }
  items.push(newItem);
  res.status(201).json(newItem);
});

app.get("/items", (req, res) => {
  res.json(items);
});

app.get("/items/:id", (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = items.find((i) => i.id === itemId);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: "Item not found." });
  }
});

app.put("/items/:id", (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = items.find((i) => i.id === itemId);
  if (item) {
    if (req.body.name) {
      item.name = req.body.name;
    }
    if (req.body.description) {
      item.description = req.body.description;
    }
    res.json(item);
  } else {
    res.status(404).json({ error: "Item not found." });
  }
});

app.delete("/items/:id", (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const itemIndex = items.findIndex((i) => i.id === itemId);
  if (itemIndex !== -1) {
    items.splice(itemIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: "Item not found." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
