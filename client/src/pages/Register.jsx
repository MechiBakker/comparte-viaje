import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8}$/;

export default function Register() {
  const [form, setForm] = useState({ dni: '', email: '', name: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordValid = PASSWORD_REGEX.test(form.password);
  const dniValid = /^[0-9]{7,8}$/.test(form.dni);
  const phoneValid = form.phone.replace(/\D/g, '').length >= 8;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!dniValid) {
      setError('El DNI debe tener 7 u 8 dígitos, sin puntos.');
      return;
    }
    if (!passwordValid) {
      setError('La clave debe tener exactamente 8 caracteres, combinando letras y números.');
      return;
    }
    if (!phoneValid) {
      setError('Ingresá un teléfono de contacto válido.');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--narrow">
      <h1>Crear cuenta</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          DNI
          <input
            required
            inputMode="numeric"
            placeholder="Sin puntos, ej: 30123456"
            value={form.dni}
            onChange={(e) => update('dni', e.target.value.replace(/\D/g, ''))}
            maxLength={8}
          />
        </label>

        <label>
          Nombre
          <input
            placeholder="Como querés que te vean otros usuarios"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </label>

        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </label>

        <label>
          Teléfono de contacto
          <input
            required
            type="tel"
            placeholder="ej: 11 2345 6789"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <span className="hint">
            Solo lo van a ver el conductor/a y los pasajeros confirmados de tus viajes.
          </span>
        </label>

        <label>
          Clave (8 caracteres, letras y números)
          <input
            required
            type="password"
            placeholder="ej: Ab3dEf7g"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            maxLength={8}
          />
          {form.password.length > 0 && (
            <span className={`hint ${passwordValid ? 'hint--ok' : 'hint--warn'}`}>
              {passwordValid
                ? 'Clave válida.'
                : 'Tiene que tener exactamente 8 caracteres, con al menos una letra y un número.'}
            </span>
          )}
        </label>

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá acá</Link>
      </p>
    </div>
  );
}