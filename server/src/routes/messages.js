import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
const MAX_LENGTH = 1000;
const SELECT = 'id, sender_id, body, created_at, profiles(name)';

// El chat es del viaje: solo lo pueden leer y escribir el conductor
// y los pasajeros con reserva confirmada.
async function checkMembership(tripId, userId) {
  const { data: trip } = await supabase
    .from('trips')
    .select('driver_id')
    .eq('id', tripId)
    .maybeSingle();

  if (!trip) return { exists: false, allowed: false };
  if (trip.driver_id === userId) return { exists: true, allowed: true };

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle();

  return { exists: true, allowed: Boolean(participant) };
}

// GET /api/trips/:tripId/messages?after=<created_at del último mensaje>
// Sin "after": los últimos 100 mensajes. Con "after": solo los nuevos.
router.get('/', requireAuth, async (req, res) => {
  const { tripId } = req.params;
  const access = await checkMembership(tripId, req.user.id);
  if (!access.exists) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (!access.allowed) {
    return res
      .status(403)
      .json({ error: 'Solo el conductor y los pasajeros confirmados pueden ver el chat.' });
  }

  const { after } = req.query;
  let query = supabase.from('messages').select(SELECT).eq('trip_id', tripId);

  if (after) {
    query = query.gt('created_at', after).order('created_at', { ascending: true }).limit(200);
  } else {
    query = query.order('created_at', { ascending: false }).limit(100);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(after ? data : data.reverse());
});

// POST /api/trips/:tripId/messages  body: { body }
router.post('/', requireAuth, async (req, res) => {
  const { tripId } = req.params;
  const access = await checkMembership(tripId, req.user.id);
  if (!access.exists) return res.status(404).json({ error: 'Viaje no encontrado.' });
  if (!access.allowed) {
    return res
      .status(403)
      .json({ error: 'Solo el conductor y los pasajeros confirmados pueden escribir en el chat.' });
  }

  const text = typeof req.body.body === 'string' ? req.body.body.trim() : '';
  if (!text) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  if (text.length > MAX_LENGTH) {
    return res.status(400).json({ error: `El mensaje no puede superar los ${MAX_LENGTH} caracteres.` });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ trip_id: tripId, sender_id: req.user.id, body: text })
    .select(SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;