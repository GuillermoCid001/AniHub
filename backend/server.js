require('dotenv').config({ path: './backend/.env' });

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '..')));

const JWT_SECRET = process.env.JWT_SECRET;

const users = [
  {
    id: 1,
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  },
  {
    id: 2,
    username: 'viewer',
    passwordHash: bcrypt.hashSync('viewer123', 10),
    role: 'viewer'
  }
];

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, username: user.username, role: user.role });
});

app.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token inválido o expirado' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor AniHub corriendo en http://localhost:${process.env.PORT || 3000}`);
});