import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Footer() {
  const { authenticated } = useAuth();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img src="/logo-full.png" alt="Comparte Viaje" className="footer__logo" />
          <p>Compartí el camino, dividí el gasto.</p>
        </div>

        <nav className="footer__links" aria-label="Enlaces del pie de página">
          <Link to="/">Buscar viajes</Link>
          {authenticated ? (
            <>
              <Link to="/publicar">Publicar viaje</Link>
              <Link to="/mis-viajes">Mis viajes</Link>
            </>
          ) : (
            <>
              <Link to="/ingresar">Ingresar</Link>
              <Link to="/registrarse">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>

      <p className="footer__copy">© {new Date().getFullYear()} Comparte Viaje</p>
    </footer>
  );
}