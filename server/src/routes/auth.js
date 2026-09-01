import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';
import { isValidDni, isValidPassword, isValidEmail } from '../utils/validators.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

function signToken(profile) {
  return jwt.sign(
    { sub: profile.id, dni: profile.id, email: profile.email, name: profile.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function publicProfile(profile) {
  return { id: profile.id, dni: profile.id, email: profile.email, name: profile.name };
}

// POST /api/auth/register
// body: { dni, email, password, name }
router.post('/register', async (req, res) => {
  const { dni, email, password, name } = req.body;

  if (!isValidDni(dni)) {
    return res.status(400).json({ error: 'El DNI debe tener 7 u 8 dígitos, sin puntos.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'El email no es válido.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error:
        'La clave debe tener exactamente 8 caracteres alfanuméricos, combinando letras y números.',
    });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, email')
    .or(`id.eq.${dni},email.eq.${email}`)
    .maybeSingle();

  if (existing) {
    const field = existing.id === dni ? 'DNI' : 'email';
    return res.status(409).json({ error: `Ya existe una cuenta registrada con ese ${field}.` });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({ id: dni, dni, email, password_hash, name: name || null })
    .select('id, email, name')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = signToken(profile);
  res.status(201).json({ token, user: publicProfile(profile) });
});

// POST /api/auth/login
// body: { dni, password }  (se loguea con DNI, no con email)
router.post('/login', async (req, res) => {
  const { dni, password } = req.body;

  if (!dni || !password) {
    return res.status(400).json({ error: 'DNI y clave son obligatorios.' });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, name, password_hash')
    .eq('id', dni)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!profile) return res.status(401).json({ error: 'DNI o clave incorrectos.' });

  const valid = await bcrypt.compare(password, profile.password_hash);
  if (!valid) return res.status(401).json({ error: 'DNI o clave incorrectos.' });

  const token = signToken(profile);
  res.json({ token, user: publicProfile(profile) });
});

// GET /api/auth/me  (requiere Authorization: Bearer <token>)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token faltante.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', decoded.sub)
      .single();

    if (error || !profile) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(publicProfile(profile));
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
});

export default router;
