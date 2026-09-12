// ============================================================================
// admin-manage-user — Supabase Edge Function
// Creates or deletes a real, login-capable Supabase Auth account. This MUST
// run server-side: `auth.admin.createUser`/`deleteUser` need the service-role
// key, which must never be shipped to the browser.
//
// Root cause this fixes: the app's old client-side createUser() only ever
// inserted a row into public.users with a random id — no matching auth.users
// account existed, so newly "created" staff could never actually log in.
//
// Deploy (one-time, from your machine):
//   supabase functions deploy admin-manage-user
//   (uses the same auto-injected SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY as
//   the other functions — no extra secrets needed)
//
// Invoked by the client (src/lib/supabaseService.js):
//   supabase.functions.invoke('admin-manage-user', { body: { action: 'create', email, password, name } })
//   supabase.functions.invoke('admin-manage-user', { body: { action: 'delete', userId } })
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

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
      return json({ success: false, error: 'Only a Super Admin can manage user accounts.' });
    }

    const body = await req.json();

    if (body.action === 'create') {
      const { email, password, name } = body;
      if (!email || !password || !name) {
        return json({ success: false, error: 'Missing email, password, or name.' });
      }
      if (String(password).length < 6) {
        return json({ success: false, error: 'Password must be at least 6 characters.' });
      }

      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (!error) return json({ success: true, userId: created.user.id });

      // Auth account for this email already exists. This can legitimately be
      // either (a) a genuine orphan — an auth-only account with no linked
      // profile row, left over from an earlier broken "create user" attempt
      // (the pre-fix version of this app never linked auth to profile rows
      // at all) — or (b) a real, currently-in-use account. Only (a) is safe
      // to take over; silently resetting (b)'s password on a typo'd email
      // would be an account takeover of someone's live account.
      const isDuplicate = /already|duplicate|exists/i.test(error.message || '');
      if (!isDuplicate) return json({ success: false, error: error.message });

      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) return json({ success: false, error: listErr.message });

      const existing = list.users.find((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (!existing) return json({ success: false, error: 'An account for this email exists but could not be located.' });

      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', existing.id)
        .maybeSingle();

      if (existingProfile) {
        return json({
          success: false,
          error: 'This email already belongs to an active account. Delete that account first if you want to replace it.'
        });
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { name }
      });
      if (updateErr) return json({ success: false, error: updateErr.message });

      return json({ success: true, userId: existing.id, reused: true });
    }

    if (body.action === 'delete') {
      const { userId } = body;
      if (!userId) return json({ success: false, error: 'Missing userId.' });

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      // "User not found" just means there was never a matching auth account
      // (e.g. a pre-fix profile row) — not a failure from the caller's POV.
      if (error && !String(error.message).toLowerCase().includes('not found')) {
        return json({ success: false, error: error.message });
      }

      return json({ success: true });
    }

    return json({ success: false, error: `Unknown action: ${body.action}` });
  } catch (err) {
    console.error('admin-manage-user error:', err);
    return json({ success: false, error: 'Unexpected server error.' });
  }
});
