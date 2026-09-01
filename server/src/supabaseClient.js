import { createClient } from '@supabase/supabase-js';

// Usamos la SERVICE ROLE KEY porque el server es quien valida el
// JWT de Keycloak y decide qué se puede hacer. Esta key NUNCA
// debe usarse en el frontend.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabaseClient] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
