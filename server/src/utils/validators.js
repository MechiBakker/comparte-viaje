// DNI argentino: 7 u 8 dígitos, sin puntos ni espacios.
export function isValidDni(dni) {
  return typeof dni === 'string' && /^[0-9]{7,8}$/.test(dni);
}

// Clave alfanumérica de exactamente 8 caracteres, con al menos
// una letra y al menos un número.
export function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8}$/.test(password)
  );
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Teléfono: entre 8 y 15 dígitos (permite espacios, guiones,
// paréntesis y el signo + para el código de país).
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}