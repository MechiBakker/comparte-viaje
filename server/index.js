import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './src/routes/auth.js';
import tripsRouter from './src/routes/trips.js';
import expensesRouter from './src/routes/expenses.js';
import messagesRouter from './src/routes/messages.js';
import cronRouter from './src/routes/cron.js';

if (!process.env.JWT_SECRET) {
  console.warn('[index] Falta JWT_SECRET en las variables de entorno.');
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use('/api/cron', cronRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/trips/:tripId/expenses', expensesRouter);
app.use('/api/trips/:tripId/messages', messagesRouter);

// Manejo de errores genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3001;

// Cuando corre en Vercel como función serverless, no queremos
// levantar un listener; api/index.js se encarga de exportar el
// handler. Para desarrollo local, sí levantamos el server.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

export default app;
