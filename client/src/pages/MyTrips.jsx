import { useEffect, useState } from 'react';
import { api } from '../api';
import TripCard from '../components/TripCard';

export default function MyTrips() {
  const [data, setData] = useState({ driving: [], riding: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getMyTrips()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Cargando tus viajes…</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="page">
      <h1>Mis viajes</h1>

      <section className="section">
        <h2>Como conductor/a</h2>
        <div className="trip-grid">
          {data.driving.length === 0 ? (
            <p className="empty-state">Todavía no publicaste ningún viaje.</p>
          ) : (
            data.driving.map((trip) => <TripCard key={trip.id} trip={trip} />)
          )}
        </div>
      </section>

      <section className="section">
        <h2>Como pasajero/a</h2>
        <div className="trip-grid">
          {data.riding.length === 0 ? (
            <p className="empty-state">Todavía no te uniste a ningún viaje.</p>
          ) : (
            data.riding.map((trip) => <TripCard key={trip.id} trip={trip} />)
          )}
        </div>
      </section>
    </div>
  );
}
