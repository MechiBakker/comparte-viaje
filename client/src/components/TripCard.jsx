import { Link } from 'react-router-dom';

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  ambos: 'Efectivo o transferencia',
};

export default function TripCard({ trip }) {
  return (
    <Link to={`/viajes/${trip.id}`} className="trip-card">
      <div className="trip-card__route">
        <span>{trip.origin}</span>
        <span className="trip-card__arrow" aria-hidden="true">
          →
        </span>
        <span>{trip.destination}</span>
      </div>

      <h3 className="trip-card__title">{trip.title}</h3>

      <div className="trip-card__meta">
        <span>{dateFormatter.format(new Date(trip.departure_date))}</span>
        <span>·</span>
        <span>{trip.seats_available} lugares</span>
        {trip.price_per_seat > 0 && (
          <>
            <span>·</span>
            <span>${trip.price_per_seat} / persona</span>
          </>
        )}
        <span>·</span>
        <span>{PAYMENT_LABELS[trip.payment_method] || 'Efectivo'}</span>
      </div>

      {trip.profiles?.name && (
        <div className="trip-card__driver">Conduce {trip.profiles.name}</div>
      )}
    </Link>
  );
}