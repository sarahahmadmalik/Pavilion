// ============================================================================
// admin-reset-password — Supabase Edge Function
// Lets a Super Admin set a new password for another account. This MUST run
// server-side: it needs the service-role key (auth.admin.updateUserById),
// which must never be shipped to the browser.
//
// Deploy (one-time, from your machine):
//   supabase functions deploy admin-reset-password
//   (uses the same auto-injected SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY as
//   send-ticket-email — no extra secrets needed)
//
// Invoked by the client (src/lib/supabaseService.js):
//   supabase.functions.invoke('admin-reset-password', { body: { userId, newPassword } })
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  // Always 200 with a {success, error} body — keeps supabase-js's functions.invoke
  // error handling simple on the client, reserving real HTTP errors for outages.
  const json = (body: unknown) => new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ success: false, error: 'Missing authorization token.' });

    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !caller) return json({ success: false, error: 'Unauthorized.' });

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return json({ success: false, error: 'Only a Super Admin can reset passwords.' });
    }

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) return json({ success: false, error: 'Missing userId or newPassword.' });
    if (String(newPassword).length < 6) return json({ success: false, error: 'Password must be at least 6 characters.' });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return json({ success: false, error: error.message });

    return json({ success: true });
  } catch (err) {
    console.error('admin-reset-password error:', err);
    return json({ success: false, error: 'Unexpected server error.' });
  }
});
