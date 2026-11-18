import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();
const PAYMENT_METHODS = ['efectivo', 'transferencia', 'ambos'];

function computeArchived(trip) {
  const departed = new Date(trip.departure_date).getTime() < Date.now();
  const full = trip.seats_available <= 0;
  return departed || full;
}

// Arma un filtro OR de PostgREST (columna ILIKE valor). Se entrecomilla
// el valor porque los nombres de ciudad llevan comas ("La Plata, Buenos Aires").
function orIlike(columns, term) {
  const safe = term.replace(/["\\]/g, '');
  return columns.map((c) => `${c}.ilike."%${safe}%"`).join(',');
}

function cleanText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// GET /api/trips?origin=&destination=&date=
// Búsqueda pública: solo viajes activos, con cupo, y que todavía no salieron.
// El origen coincide con la ciudad de origen o con el punto de salida;
// el destino, con la ciudad de destino o con el punto de llegada.
router.get('/', optionalAuth, async (req, res) => {
  const { origin, destination, date } = req.query;

  let query = supabase
    .from('trips')
    .select('*, profiles!trips_driver_id_fkey(name, email)')
    .eq('status', 'active')
    .gt('seats_available', 0)
    .gte('departure_date', new Date().toISOString())
    .order('departure_date', { ascending: true });

  if (origin) query = query.or(orIlike(['origin', 'departure_point'], origin));
  if (destination) query = query.or(orIlike(['destination', 'arrival_point'], destination));
  if (date) {
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    query = query.gte('departure_date', start).lte('departure_date', end);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/trips/mine  -> viajes que yo publiqué o en los que participo
router.get('/mine', requireAuth, async (req, res) => {
  const { data: asDriver, error: e1 } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', req.user.id)
    .order('departure_date', { ascending: false });

  const { data: asPassenger, error: e2 } = await supabase
    .from('trip_participants')
    .select('trip:trips(*)')
    .eq('user_id', req.user.id);

  if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });

  res.json({
    driving: (asDriver || []).map((t) => ({ ...t, is_archived: computeArchived(t) })),
    riding: asPassenger
      .map((p) => p.trip)
      .filter(Boolean)
      .map((t) => ({ ...t, is_archived: computeArchived(t) })),
  });
});

// GET /api/trips/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*, profiles!trips_driver_id_fkey(name, email, phone)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Viaje no encontrado.' });

  const { data: participants } = await supabase
    .from('trip_participants')
    .select('*, profiles(name, email, phone)')
    .eq('trip_id', req.params.id);

  const isDriver = req.user?.id === trip.driver_id;
  const isConfirmedParticipant = (participants || []).some(
    (p) => p.user_id === req.user?.id && p.status === 'confirmed'
  );
  const canSeeContactInfo = isDriver || isConfirmedParticipant;

  function stripContact(profile) {
    if (!profile) return profile;
    return canSeeContactInfo ? profile : { name: profile.name };
  }

  const participantsOut = (participants || []).map((p) => ({
    ...p,
    profiles: stripContact(p.profiles),
  }));

  res.json({
    ...trip,
    profiles: stripContact(trip.profiles),
    participants: participantsOut,
    is_archived: computeArchived(trip),
    has_reservations: trip.seats_available !== trip.seats_total,
  });
});

// POST /api/trips -> publicar un viaje
router.post('/', requireAuth, async (req, res) => {
  const {
    title,
    origin,
    destination,
    departure_point,
    arrival_point,
    departure_date,
    seats_total,
    price_per_seat,
    description,
    payment_method,
  } = req.body;

  if (!title || !origin || !destination || !departure_date || !seats_total) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const method = payment_method || 'efectivo';
  if (!PAYMENT_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Medio de pago inválido.' });
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      driver_id: req.user.id,
      title,
      origin,
      destination,
      departure_point: cleanText(departure_point),
      arrival_point: cleanText(arrival_point),
      departure_date,
      seats_total,
      seats_available: seats_total,
      price_per_seat: price_per_seat || 0,
      description,
      payment_method: method,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/trips/:id -> editar título, descripción, fecha de salida y
// puntos de encuentro. Solo el conductor, y solo si todavía no hay reservas.
router.patch('/:id', requireAuth, async (req, res) => {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (tripError) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Solo el conductor puede editar el viaje.' });
  }
  if (trip.seats_available !== trip.seats_total) {
    return res.status(409).json({
      error: 'No se puede editar un viaje que ya tiene reservas confirmadas.',
    });
  }

  const { title, description, departure_date, departure_point, arrival_point } = req.body;
  const updates = {};

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'El título no puede estar vacío.' });
    updates.title = title;
  }
  if (description !== undefined) updates.description = description;
  if (departure_point !== undefined) updates.departure_point = cleanText(departure_point);
  if (arrival_point !== undefined) updates.arrival_point = cleanText(arrival_point);
  if (departure_date !== undefined) {
    const parsed = new Date(departure_date);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() < Date.now()) {
      return res.status(400).json({ error: 'La fecha de salida debe ser válida y futura.' });
    }
    updates.departure_date = parsed.toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No se envió ningún campo para actualizar.' });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/trips/:id/join -> reservar lugar en un viaje
router.post('/:id/join', requireAuth, async (req, res) => {
  const tripId = req.params.id;
  const seats = req.body.seats_reserved || 1;

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (trip.driver_id === req.user.id) {
    return res.status(400).json({ error: 'No podés unirte a tu propio viaje.' });
  }
  if (trip.seats_available < seats) {
    return res.status(400).json({ error: 'No hay suficientes lugares disponibles.' });
  }

  const { data, error } = await supabase
    .from('trip_participants')
    .insert({ trip_id: tripId, user_id: req.user.id, seats_reserved: seats })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('trips')
    .update({ seats_available: trip.seats_available - seats })
    .eq('id', tripId);

  res.status(201).json(data);
});

// DELETE /api/trips/:id -> eliminar/cancelar un viaje.
// Solo el conductor, y solo si todavía no hay reservas confirmadas.
router.delete('/:id', requireAuth, async (req, res) => {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('driver_id, seats_available, seats_total')
    .eq('id', req.params.id)
    .single();

  if (tripError) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Solo el conductor puede eliminar el viaje.' });
  }
  if (trip.seats_available !== trip.seats_total) {
    return res.status(409).json({
      error: 'No se puede eliminar un viaje que ya tiene reservas confirmadas.',
    });
  }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;