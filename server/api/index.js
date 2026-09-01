import app from '../index.js';

// Vercel detecta automáticamente cualquier archivo dentro de /api
// como una función serverless. Una app de Express es en sí misma
// un handler (req, res) válido, así que no hace falta nada más.
export default app;
