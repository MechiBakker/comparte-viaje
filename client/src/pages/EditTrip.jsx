import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

function toDatetimeLocal(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditTrip() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    departure_date: '',
    departure_point: '',
    arrival_point: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getTrip(id)
      .then((trip) => {
        if (trip.driver_id !== user?.id) {
          setError('No tenés permiso para editar este viaje.');
          return;
        }
        if (trip.has_reservations) {
          setError('Este viaje ya tiene reservas confirmadas, no se puede editar.');
          return;
        }
        setForm({
          title: trip.title,
          description: trip.description || '',
          departure_date: toDatetimeLocal(trip.departure_date),
          departure_point: trip.departure_point || '',
          arrival_point: trip.arrival_point || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.updateTrip(id, {
        title: form.title,
        description: form.description,
        departure_point: form.departure_point,
        arrival_point: form.arrival_point,
        departure_date: new Date(form.departure_date).toISOString(),
      });
      navigate(`/viajes/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Cargando…</div>;

  if (error && !form.title) {
    return (
      <div className="page page--narrow">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <h1>Editar viaje</h1>
      <p className="trip-detail__date">
        Podés modificar el título, la descripción, la fecha y horario de salida y los puntos de
        encuentro. Las ciudades, los cupos y el precio no se pueden cambiar una vez publicado.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <div className="form__row">
          <label>
            Lugar de salida (opcional)
            <input
              value={form.departure_point}
              onChange={(e) => update('departure_point', e.target.value)}
            />
          </label>
          <label>
            Lugar de llegada (opcional)
            <input
              value={form.arrival_point}
              onChange={(e) => update('arrival_point', e.target.value)}
            />
          </label>
        </div>

        <label>
          Fecha y hora de salida
          <input
            required
            type="datetime-local"
            value={form.departure_date}
            onChange={(e) => update('departure_date', e.target.value)}
          />
        </label>

        <label>
          Descripción
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}