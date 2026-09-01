import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || '';
const STORAGE_KEY = 'comparte_viaje_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function loadUser(currentToken) {
    if (!currentToken) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) throw new Error('Sesión inválida');
      setUser(await res.json());
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    loadUser(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuthResponse(res) {
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Error de autenticación.');
    localStorage.setItem(STORAGE_KEY, body.token);
    setToken(body.token);
    setUser(body.user);
    return body.user;
  }

  async function register({ dni, email, password, name }) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, email, password, name }),
    });
    return handleAuthResponse(res);
  }

  async function login({ dni, password }) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password }),
    });
    return handleAuthResponse(res);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value = {
    ready,
    authenticated: Boolean(user),
    user,
    token: () => token,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
