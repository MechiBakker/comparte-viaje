import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

// Se borran los viajes cuya fecha de salida es anterior a esta cantidad de días.
const RETENTION_DAYS = Number(process.env.TRIP_RETENTION_DAYS) || 10;

// Vercel Cron llama a esta ruta con GET y manda
// "Authorization: Bearer <CRON_SECRET>" cuando CRON_SECRET está definida.
// Sin esa variable la ruta rechaza todo: es una ruta que borra datos.
function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

// GET /api/cron/maintenance[?dry_run=1]
// 1) Borra los viajes viejos (junto con sus reservas, chats y gastos,
//    por ON DELETE CASCADE).
// 2) Como consulta la base todos los días, también evita que Supabase
//    pause el proyecto por inactividad.
// Con ?dry_run=1 solo cuenta lo que borraría, sin borrar nada.
router.get('/maintenance', requireCronSecret, async (req, res) => {
  const dryRun = req.query.dry_run === '1';
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .lt('departure_date', cutoff);

  if (countError) return res.status(500).json({ error: countError.message });

  const summary = { retention_days: RETENTION_DAYS, older_than: cutoff, trips_found: count };

  if (dryRun || count === 0) {
    return res.json({ ...summary, dry_run: dryRun, deleted: 0 });
  }

  const { error: deleteError } = await supabase
    .from('trips')
    .delete()
    .lt('departure_date', cutoff);

  if (deleteError) return res.status(500).json({ error: deleteError.message });

  res.json({ ...summary, dry_run: false, deleted: count });
});

export default router;