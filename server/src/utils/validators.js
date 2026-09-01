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
