import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import ExpenseList from '../components/ExpenseList';

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

export default function TripDetail() {
  const { id } = useParams();
  const { authenticated } = useAuth();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const tripData = await api.getTrip(id);
      setTrip(tripData);

      if (authenticated) {
        const [expensesData, balanceData] = await Promise.all([
          api.getExpenses(id),
          api.getBalance(id),
        ]);
        setExpenses(expensesData);
        setBalance(balanceData);
      }
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

  async function handleAddExpense(e) {
    e.preventDefault();
    try {
      await api.addExpense(id, {
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
      });
      setExpenseForm({ description: '', amount: '' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page-loading">Cargando viaje…</div>;
  if (!trip) return <div className="error-banner">Viaje no encontrado.</div>;

  const participantNames = {
    [trip.driver_id]: trip.profiles?.name || 'Conductor',
    ...(trip.participants || []).reduce(
      (acc, p) => ({ ...acc, [p.user_id]: p.profiles?.name || p.user_id }),
      {}
    ),
  };

  const confirmedParticipants = (trip.participants || []).filter((p) => p.status === 'confirmed');
  const hasDriverContact = Boolean(trip.profiles?.email);

  return (
    <div className="page page--narrow">
      <div className="trip-detail__header">
        <div className="trip-detail__route">
          {trip.origin} <span aria-hidden="true">→</span> {trip.destination}
        </div>
        <h1>{trip.title}</h1>
        <p className="trip-detail__date">{dateFormatter.format(new Date(trip.departure_date))}</p>
      </div>

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
          <span className="stat-value">{trip.profiles?.name || '—'}</span>
          <span className="stat-label">conductor/a</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {authenticated ? (
        <>
          {trip.seats_available > 0 && (
            <button className="btn btn--primary" onClick={handleJoin}>
              Reservar lugar
            </button>
          )}

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

          <section className="section">
            <h2>Gastos del viaje</h2>

            <form className="form form--inline" onSubmit={handleAddExpense}>
              <input
                required
                placeholder="Descripción (ej: nafta, peaje)"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <button type="submit" className="btn btn--secondary">
                Agregar gasto
              </button>
            </form>

            <ExpenseList
              expenses={expenses}
              balance={balance}
              participantNames={participantNames}
            />
          </section>
        </>
      ) : (
        <div className="callout">
          <p>Iniciá sesión para reservar tu lugar y ver los gastos compartidos.</p>
          <Link to="/ingresar" className="btn btn--primary">
            Ingresar
          </Link>
        </div>
      )}
    </div>
  );
}