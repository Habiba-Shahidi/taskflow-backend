const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const authenticate = require('./middleware/auth');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ---------- PUBLIC ROUTES (no token needed) ----------

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).send('Name is required');
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).send('A valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).send('Password must be at least 6 characters');
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).send('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name.trim(), email, passwordHash]
  );

  res.status(201).json({ id: result.insertId, name: name.trim(), email });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).send('Email and password are required');
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) {
    return res.status(401).send('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).send('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// ---------- PROTECTED ROUTES (token required) ----------

app.get('/tasks', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, created_at FROM tasks WHERE user_id = ?',
    [req.user.id]
  );
  res.json(rows);
});

app.get('/tasks/:id', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, created_at FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) {
    return res.status(404).send('Task not found');
  }
  res.json(rows[0]);
});

app.post('/tasks', authenticate, async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).send('Title is required');
  }

  const [result] = await pool.query(
    'INSERT INTO tasks (title, user_id) VALUES (?, ?)',
    [title.trim(), req.user.id]
  );
  res.status(201).json({ id: result.insertId, title: title.trim() });
});

app.put('/tasks/:id', authenticate, async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).send('Title is required');
  }

  const [result] = await pool.query(
    'UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?',
    [title.trim(), req.params.id, req.user.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).send('Task not found');
  }
  res.json({ id: Number(req.params.id), title: title.trim() });
});

app.delete('/tasks/:id', authenticate, async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).send('Task not found');
  }
  res.status(204).send();
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).send('Already exists');
  }

  res.status(500).send('Something went wrong');
});
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});