import { useEffect, useState } from 'react';
import { api } from '../api';
import TripCard from '../components/TripCard';
import { ARGENTINE_CITIES } from '../data/cities';

export default function Home() {
  const [filters, setFilters] = useState({ origin: '', destination: '', date: '' });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <form className="search-bar" onSubmit={search}>
        <input
          type="text"
          list="cities-datalist"
          placeholder="Origen"
          value={filters.origin}
          onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
        />
        <input
          type="text"
          list="cities-datalist"
          placeholder="Destino"
          value={filters.destination}
          onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
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

      <datalist id="cities-datalist">
        {ARGENTINE_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

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
    </div>
  );
}