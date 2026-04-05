require('dotenv').config({ path: './backend/.env' });

const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcrypt');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '..')));

const JWT_SECRET = process.env.JWT_SECRET;
const USERS_FILE = path.join(__dirname, 'users.json');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const defaults = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@anihub.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        verified: true,
        profiles: [{ name: 'Admin', avatar: '⭐' }]
      },
      {
        id: 2,
        username: 'prueba',
        email: 'prueba@anihub.com',
        passwordHash: bcrypt.hashSync('prueba123', 10),
        role: 'viewer',
        verified: true,
        profiles: [{ name: 'Prueba', avatar: '🐉' }]
      }
    ];
    saveUsers(defaults);
    return defaults;
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

const pendingVerifications = new Map();

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  if (!user.verified) return res.status(403).json({ error: 'Cuenta no verificada. Revisa tu email.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, username: user.username, role: user.role });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const users = loadUsers();

  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });

  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Ese email ya está registrado' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = await bcrypt.hash(password, 10);

  pendingVerifications.set(email, {
    code, username, passwordHash,
    expiresAt: Date.now() + 15 * 60 * 1000
  });

  console.log(`📧 Código para ${email}: ${code}`);

  try {
    await transporter.sendMail({
      from: `"AniHub" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Código de verificación — AniHub',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #e50914;">AniHub</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu código de verificación es:</p>
          <div style="font-size:2.5rem;font-weight:bold;letter-spacing:10px;color:#e50914;margin:24px 0;text-align:center;">${code}</div>
          <p style="color:#888;font-size:0.85em;">Caduca en 15 minutos.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Error al enviar email:', err);
    return res.status(500).json({ error: 'No se pudo enviar el email de verificación' });
  }

  res.json({ message: 'Código enviado. Revisa tu bandeja de entrada.' });
});

app.post('/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email y código son obligatorios' });

  const pending = pendingVerifications.get(email);
  if (!pending) return res.status(400).json({ error: 'No hay ningún registro pendiente para ese email' });
  if (Date.now() > pending.expiresAt) {
    pendingVerifications.delete(email);
    return res.status(400).json({ error: 'El código ha expirado. Vuelve a registrarte.' });
  }
  if (pending.code !== code.trim()) return res.status(400).json({ error: 'Código incorrecto' });

  const users = loadUsers();
  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username: pending.username,
    email,
    passwordHash: pending.passwordHash,
    role: 'viewer',
    verified: true,
    profiles: [{ name: pending.username, avatar: '🐉' }]
  };

  users.push(newUser);
  saveUsers(users);
  pendingVerifications.delete(email);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, username: newUser.username, role: newUser.role });
});

app.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, error: 'Token inválido o expirado' });
  }
});

app.get('/profiles', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user.profiles || []);
});

app.post('/profiles', authMiddleware, (req, res) => {
  const { name, avatar } = req.body;
  if (!name || !avatar) return res.status(400).json({ error: 'Nombre y avatar son obligatorios' });

  const users = loadUsers();
  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (!users[userIdx].profiles) users[userIdx].profiles = [];
  if (users[userIdx].profiles.length >= 5)
    return res.status(400).json({ error: 'Máximo 5 perfiles por cuenta' });

  users[userIdx].profiles.push({ name: name.trim(), avatar });
  saveUsers(users);

  res.json({ profiles: users[userIdx].profiles });
});

app.put('/profiles/:index', authMiddleware, (req, res) => {
  const { name, avatar } = req.body;
  const index = parseInt(req.params.index);

  const users = loadUsers();
  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  const profiles = users[userIdx].profiles || [];
  if (index < 0 || index >= profiles.length)
    return res.status(400).json({ error: 'Perfil no encontrado' });

  profiles[index] = { name: name.trim(), avatar };
  users[userIdx].profiles = profiles;
  saveUsers(users);

  res.json({ profiles });
});

app.delete('/profiles/:index', authMiddleware, (req, res) => {
  const index = parseInt(req.params.index);

  const users = loadUsers();
  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  const profiles = users[userIdx].profiles || [];
  if (profiles.length <= 1)
    return res.status(400).json({ error: 'Debe haber al menos un perfil' });
  if (index < 0 || index >= profiles.length)
    return res.status(400).json({ error: 'Perfil no encontrado' });

  profiles.splice(index, 1);
  users[userIdx].profiles = profiles;
  saveUsers(users);

  res.json({ profiles });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor AniHub corriendo en http://localhost:${process.env.PORT || 3000}`);
});