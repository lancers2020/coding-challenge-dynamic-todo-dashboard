const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { redisClient } = require("./redisClient");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- TODO API ---
// Create a todo
app.post("/api/todos", async (req, res) => {
  const todo = req.body;
  if (!todo || !todo.title) {
    return res.status(400).json({ error: 'todo must include a title' });
  }

  console.log(':::todo (received)', todo);
  // avoid a space after colon so we can reliably startsWith('todos:')
  const key = `todos:${todo.title}${Math.floor(Math.random() * 10000)}`;
  await redisClient.set(key, todo, "json");

  // Return the stored todo and the key so frontend can delete later
  res.json({ ...todo, key });
});

// List todos
app.get("/api/todos", async (req, res) => {
  const entries = await redisClient.getAllData();
  console.log(':::entries', entries);

  // entries are objects like { key: string, value: any, type: string }
  const todos = entries
    .filter((e) => typeof e.key === 'string' && e.key.startsWith('todos:'))
    .map((e) => ({ ...(e.value || {}), key: e.key }))
    .filter((v) => v != null);

  console.log(':::todos', todos);
  res.json(todos);
});

// Update a todo by key with partial updates: { key, updates }
app.patch('/api/todos', async (req, res) => {
  const { key, updates } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Request body must include `key` string' });
  }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Request body must include `updates` object' });
  }

  try {
    const existing = await redisClient.get(key, 'json');
    if (existing == null) return res.status(404).json({ error: 'Key not found' });

    const updated = { ...existing, ...updates };
    await redisClient.set(key, updated, 'json');
    console.log(`Updated key=${key}`, updated);
    return res.json({ ...updated, key });
  } catch (err) {
    console.error('Error updating key', key, err);
    return res.status(500).json({ error: 'Failed to update key' });
  }
});

// DELETE by JSON body: { key: 'todos:...' }
app.delete('/api/todos', async (req, res) => {
  const { key } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Request body must include `key` string' });
  }

  try {
    const deletedCount = await redisClient.del(key);
    console.log(`Deleted key=${key} -> ${deletedCount}`);
    return res.json({ key, deleted: deletedCount });
  } catch (err) {
    console.error('Error deleting key', key, err);
    return res.status(500).json({ error: 'Failed to delete key' });
  }
});

// DELETE by URL-encoded key: /api/todos/:encodedKey
app.delete('/api/todos/:encodedKey', async (req, res) => {
  const encoded = req.params.encodedKey;
  if (!encoded) return res.status(400).json({ error: 'Missing key parameter' });

  const key = decodeURIComponent(encoded);
  try {
    const deletedCount = await redisClient.del(key);
    console.log(`Deleted key=${key} -> ${deletedCount}`);
    return res.json({ key, deleted: deletedCount });
  } catch (err) {
    console.error('Error deleting key', key, err);
    return res.status(500).json({ error: 'Failed to delete key' });
  }
});

const PORT = 4000;
app.listen(PORT, async () => {
  await redisClient.connect();
  console.log(`✅ Pandemic Survival backend running on port ${PORT}`);
});
