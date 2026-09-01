import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateBalances } from '../utils/balances.js';

const router = Router({ mergeParams: true });

async function getTripMemberIds(tripId) {
  const { data: trip } = await supabase.from('trips').select('driver_id').eq('id', tripId).single();
  const { data: participants } = await supabase
    .from('trip_participants')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('status', 'confirmed');

  const ids = new Set(participants?.map((p) => p.user_id) || []);
  if (trip) ids.add(trip.driver_id);
  return Array.from(ids);
}

// GET /api/trips/:tripId/expenses
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*), profiles!expenses_paid_by_fkey(name, email)')
    .eq('trip_id', req.params.tripId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/trips/:tripId/expenses
// body: { description, amount, split_between?: [user_id, ...] }
// Si no se especifica split_between, se divide entre todos los
// miembros confirmados del viaje (conductor + pasajeros).
router.post('/', requireAuth, async (req, res) => {
  const { tripId } = req.params;
  const { description, amount, split_between } = req.body;

  if (!description || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Descripción y monto válido son obligatorios.' });
  }

  const memberIds = split_between?.length ? split_between : await getTripMemberIds(tripId);
  if (memberIds.length === 0) {
    return res.status(400).json({ error: 'No hay participantes para dividir el gasto.' });
  }

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({ trip_id: tripId, paid_by: req.user.id, description, amount })
    .select()
    .single();

  if (expenseError) return res.status(500).json({ error: expenseError.message });

  const perPerson = Math.round((amount / memberIds.length) * 100) / 100;
  const splits = memberIds.map((user_id) => ({
    expense_id: expense.id,
    user_id,
    amount_owed: perPerson,
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splits);
  if (splitsError) return res.status(500).json({ error: splitsError.message });

  res.status(201).json({ ...expense, expense_splits: splits });
});

// GET /api/trips/:tripId/expenses/balance
// Devuelve el balance neto y las transferencias sugeridas para saldar cuentas.
router.get('/balance', requireAuth, async (req, res) => {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, paid_by, amount, expense_splits(user_id, amount_owed)')
    .eq('trip_id', req.params.tripId);

  if (error) return res.status(500).json({ error: error.message });

  const normalized = expenses.map((e) => ({
    ...e,
    splits: e.expense_splits,
  }));

  const { net, settlements } = calculateBalances(normalized);
  res.json({ net, settlements });
});

export default router;
