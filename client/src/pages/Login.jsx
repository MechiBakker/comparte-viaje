import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ dni, password });
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--narrow">
      <h1>Ingresar</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          DNI
          <input
            required
            inputMode="numeric"
            placeholder="Sin puntos, ej: 30123456"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            maxLength={8}
          />
        </label>

        <label>
          Clave
          <input
            required
            type="password"
            placeholder="8 caracteres, letras y números"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={8}
          />
        </label>

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tenés cuenta? <Link to="/registrarse">Registrate acá</Link>
      </p>
    </div>
  );
}
