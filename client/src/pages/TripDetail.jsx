import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import TripChat from '../components/TripChat';

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  ambos: 'Efectivo o transferencia',
};

export default function TripDetail() {
  const { id } = useParams();
  const { authenticated, user } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const tripData = await api.getTrip(id);
      setTrip(tripData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authenticated]);

  async function handleJoin() {
    try {
      await api.joinTrip(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    const message = trip.has_reservations
      ? 'Este viaje tiene reservas confirmadas. ¿Seguro que querés eliminarlo igual? No se puede deshacer.'
      : '¿Seguro que querés eliminar este viaje? No se puede deshacer.';
    if (!window.confirm(message)) return;
    setDeleting(true);
    try {
      await api.cancelTrip(id);
      navigate(trip.driver_id === user?.id ? '/mis-viajes' : '/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <div className="page-loading">Cargando viaje…</div>;
  if (!trip) return <div className="error-banner">Viaje no encontrado.</div>;

  const confirmedParticipants = (trip.participants || []).filter((p) => p.status === 'confirmed');
  const hasDriverContact = Boolean(trip.profiles?.email);
  const paymentLabel = PAYMENT_LABELS[trip.payment_method] || 'Efectivo';
  const isDriver = trip.driver_id === user?.id;
  const isParticipant = confirmedParticipants.some((p) => p.user_id === user?.id);
  const isMember = isDriver || isParticipant;
  const isCancelled = trip.status === 'cancelled';
  const departed = new Date(trip.departure_date).getTime() < Date.now();

  let archivedMessage = 'Este viaje ya no tiene lugares disponibles.';
  if (isCancelled) archivedMessage = 'Este viaje fue cancelado.';
  else if (departed) archivedMessage = 'Este viaje ya salió.';

  return (
    <div className="page page--narrow">
      {trip.is_archived && <div className="archived-banner">{archivedMessage}</div>}

      {trip.is_admin && (
        <div className="admin-banner">Estás viendo este viaje como administrador/a.</div>
      )}

      <div className="trip-detail__header">
        <div className="trip-detail__route">
          {trip.origin} <span aria-hidden="true">→</span> {trip.destination}
        </div>
        <h1>{trip.title}</h1>
        <p className="trip-detail__date">{dateFormatter.format(new Date(trip.departure_date))}</p>
      </div>

      {(trip.departure_point || trip.arrival_point) && (
        <div className="trip-points">
          {trip.departure_point && (
            <p>
              <strong>Salida:</strong> {trip.departure_point}
            </p>
          )}
          {trip.arrival_point && (
            <p>
              <strong>Llegada:</strong> {trip.arrival_point}
            </p>
          )}
        </div>
      )}

      {trip.description && <p className="trip-detail__description">{trip.description}</p>}

      <div className="trip-detail__stats">
        <div>
          <span className="stat-value">{trip.seats_available}</span>
          <span className="stat-label">lugares libres</span>
        </div>
        <div>
          <span className="stat-value">${trip.price_per_seat || 0}</span>
          <span className="stat-label">por persona</span>
        </div>
        <div>
          <span className="stat-value">{paymentLabel}</span>
          <span className="stat-label">medio de pago</span>
        </div>
        <div>
          <span className="stat-value">{trip.profiles?.name || '—'}</span>
          <span className="stat-label">conductor/a</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {(isDriver || trip.is_admin) && (
        <div className="owner-actions">
          {trip.can_manage ? (
            <>
              <Link to={`/viajes/${id}/editar`} className="btn btn--secondary">
                Editar viaje
              </Link>
              <button className="btn btn--ghost" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Eliminar viaje'}
              </button>
            </>
          ) : (
            <p className="hint">
              Este viaje ya tiene reservas, así que no se puede editar ni eliminar.
            </p>
          )}
        </div>
      )}

      {authenticated ? (
        <>
          {!isMember && !trip.is_archived && (
            <button className="btn btn--primary" onClick={handleJoin}>
              Reservar lugar
            </button>
          )}

          {isParticipant && <p className="hint">Ya tenés un lugar reservado en este viaje.</p>}

          {hasDriverContact && (
            <div className="contact-card">
              <h4>Contacto del conductor/a</h4>
              <p>{trip.profiles.name}</p>
              <p>{trip.profiles.email}</p>
              {trip.profiles.phone && <p>{trip.profiles.phone}</p>}
            </div>
          )}

          {confirmedParticipants.some((p) => p.profiles?.email) && (
            <div className="contact-card">
              <h4>Pasajeros confirmados</h4>
              {confirmedParticipants.map((p) => (
                <div key={p.id} className="contact-card__row">
                  <strong>{p.profiles?.name || 'Pasajero/a'}</strong>
                  {p.profiles?.email && <span> · {p.profiles.email}</span>}
                  {p.profiles?.phone && <span> · {p.profiles.phone}</span>}
                </div>
              ))}
            </div>
          )}

          {isMember && (
            <section className="section">
              <h2>Chat del viaje</h2>
              <TripChat tripId={id} currentUserId={user?.id} />
            </section>
          )}
        </>
      ) : (
        <div className="callout">
          <p>Iniciá sesión para reservar tu lugar.</p>
          <Link to="/ingresar" className="btn btn--primary">
            Ingresar
          </Link>
        </div>
      )}
    </div>
  );
}