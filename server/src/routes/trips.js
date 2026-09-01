import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/trips?origin=&destination=&date=
// Búsqueda pública de viajes activos.
router.get('/', optionalAuth, async (req, res) => {
  const { origin, destination, date } = req.query;

  let query = supabase
    .from('trips')
    .select('*, profiles!trips_driver_id_fkey(name, email)')
    .eq('status', 'active')
    .order('departure_date', { ascending: true });

  if (origin) query = query.ilike('origin', `%${origin}%`);
  if (destination) query = query.ilike('destination', `%${destination}%`);
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
    .eq('driver_id', req.user.id);

  const { data: asPassenger, error: e2 } = await supabase
    .from('trip_participants')
    .select('trip:trips(*)')
    .eq('user_id', req.user.id);

  if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });

  res.json({
    driving: asDriver,
    riding: asPassenger.map((p) => p.trip),
  });
});

// GET /api/trips/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*, profiles!trips_driver_id_fkey(name, email)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Viaje no encontrado.' });

  const { data: participants } = await supabase
    .from('trip_participants')
    .select('*, profiles(name, email)')
    .eq('trip_id', req.params.id);

  res.json({ ...trip, participants });
});

// POST /api/trips -> publicar un viaje
router.post('/', requireAuth, async (req, res) => {
  const { title, origin, destination, departure_date, seats_total, price_per_seat, description } =
    req.body;

  if (!title || !origin || !destination || !departure_date || !seats_total) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      driver_id: req.user.id,
      title,
      origin,
      destination,
      departure_date,
      seats_total,
      seats_available: seats_total,
      price_per_seat: price_per_seat || 0,
      description,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
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

// DELETE /api/trips/:id -> cancelar un viaje (solo el conductor)
router.delete('/:id', requireAuth, async (req, res) => {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('driver_id')
    .eq('id', req.params.id)
    .single();

  if (tripError) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Solo el conductor puede cancelar el viaje.' });
  }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
