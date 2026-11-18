import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import TripCard from '../components/TripCard';
import CityInput from '../components/CityInput';

export default function Home() {
  const { ready, authenticated } = useAuth();
  const [filters, setFilters] = useState({ origin: '', destination: '', date: '' });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function search(e) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v.trim() !== '')
      );
      const data = await api.getTrips(cleanFilters);
      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Los viajes solo se piden cuando hay sesión iniciada.
  useEffect(() => {
    if (authenticated) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  if (!ready) return <div className="page-loading">Cargando…</div>;

  return (
    <div className="page">
      <section className="hero">
        <h1>
          Compartí el camino,
          <br />
          dividí el gasto.
        </h1>
        <p>Buscá viajes publicados por otros usuarios o publicá el tuyo en segundos.</p>
      </section>

      {!authenticated ? (
        <div className="callout">
          <p>Ingresá o creá tu cuenta para buscar y ver los viajes publicados.</p>
          <div className="owner-actions">
            <Link to="/ingresar" className="btn btn--secondary">
              Ingresar
            </Link>
            <Link to="/registrarse" className="btn btn--primary">
              Crear cuenta
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form className="search-bar" onSubmit={search}>
            <CityInput
              placeholder="Origen"
              value={filters.origin}
              onChange={(v) => setFilters((f) => ({ ...f, origin: v }))}
            />
            <CityInput
              placeholder="Destino"
              value={filters.destination}
              onChange={(v) => setFilters((f) => ({ ...f, destination: v }))}
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
          </form>

          {loading && <div className="page-loading">Buscando viajes…</div>}
          {error && <div className="error-banner">{error}</div>}

          {!loading && !error && (
            <div className="trip-grid">
              {trips.length === 0 ? (
                <p className="empty-state">No se encontraron viajes con esos filtros.</p>
              ) : (
                trips.map((trip) => <TripCard key={trip.id} trip={trip} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}