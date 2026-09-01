import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { authenticated, user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__brand-mark" aria-hidden="true" />
        Comparte Viaje
      </Link>

      <nav className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Buscar
        </NavLink>
        {authenticated && (
          <>
            <NavLink to="/publicar" className={({ isActive }) => (isActive ? 'active' : '')}>
              Publicar viaje
            </NavLink>
            <NavLink to="/mis-viajes" className={({ isActive }) => (isActive ? 'active' : '')}>
              Mis viajes
            </NavLink>
          </>
        )}
      </nav>

      <div className="navbar__auth">
        {authenticated ? (
          <>
            <span className="navbar__user">{user?.name || `DNI ${user?.dni}`}</span>
            <button className="btn btn--ghost" onClick={logout}>
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/ingresar" className="btn btn--ghost">
              Ingresar
            </Link>
            <Link to="/registrarse" className="btn btn--primary">
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
