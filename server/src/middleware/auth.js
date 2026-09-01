import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que exige un Bearer token válido, emitido por
 * nuestro propio /api/auth/login o /api/auth/register.
 * El "sub" del token es el DNI del usuario, que usamos como
 * user id en toda la app.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticación faltante.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, dni: decoded.dni, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/**
 * Igual que requireAuth pero no falla si no hay token: solo
 * adjunta req.user cuando el token es válido.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, dni: decoded.dni, email: decoded.email, name: decoded.name };
  } catch {
    // Token inválido: seguimos como anónimo.
  }
  next();
}
