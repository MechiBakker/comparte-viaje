import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import CityInput from '../components/CityInput';

const initialState = {
  title: '',
  origin: '',
  destination: '',
  departure_point: '',
  arrival_point: '',
  departure_date: '',
  seats_total: 3,
  price_per_seat: 0,
  payment_method: 'efectivo',
  description: '',
};

export default function CreateTrip() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const trip = await api.createTrip({
        ...form,
        seats_total: Number(form.seats_total),
        price_per_seat: Number(form.price_per_seat),
        departure_date: new Date(form.departure_date).toISOString(),
      });
      navigate(`/viajes/${trip.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--narrow">
      <h1>Publicar un viaje</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            required
            placeholder="Ej: Viaje a la costa - fin de semana largo"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <div className="form__row">
          <label>
            Ciudad de origen
            <CityInput
              required
              placeholder="Empezá a escribir…"
              value={form.origin}
              onChange={(v) => update('origin', v)}
            />
          </label>
          <label>
            Ciudad de destino
            <CityInput
              required
              placeholder="Empezá a escribir…"
              value={form.destination}
              onChange={(v) => update('destination', v)}
            />
          </label>
        </div>

        <div className="form__row">
          <label>
            Lugar de salida (opcional)
            <input
              placeholder="Ej: Terminal de ómnibus"
              value={form.departure_point}
              onChange={(e) => update('departure_point', e.target.value)}
            />
          </label>
          <label>
            Lugar de llegada (opcional)
            <input
              placeholder="Ej: Plaza principal"
              value={form.arrival_point}
              onChange={(e) => update('arrival_point', e.target.value)}
            />
          </label>
        </div>

        <div className="form__row">
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
            Lugares disponibles
            <input
              required
              type="number"
              min="1"
              value={form.seats_total}
              onChange={(e) => update('seats_total', e.target.value)}
            />
          </label>
        </div>

        <div className="form__row">
          <label>
            Precio por persona (opcional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price_per_seat}
              onChange={(e) => update('price_per_seat', e.target.value)}
            />
          </label>
          <label>
            Medio de pago
            <select
              value={form.payment_method}
              onChange={(e) => update('payment_method', e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="ambos">Efectivo o transferencia</option>
            </select>
          </label>
        </div>

        <label>
          Descripción
          <textarea
            rows={4}
            placeholder="Equipaje permitido, mascotas, etc."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Publicando…' : 'Publicar viaje'}
        </button>
      </form>
    </div>
  );
}