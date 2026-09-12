// Shared CORS helper for all edge functions in this project.
// Reflects the request's Origin only when it's localhost/127.0.0.1 (dev) or
// matches the ALLOWED_ORIGIN secret (set this once you have a production
// domain: `supabase secrets set ALLOWED_ORIGIN=https://your-domain.com`).
const DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  const isAllowed = (!!allowedOrigin && origin === allowedOrigin) || DEV_ORIGIN_PATTERN.test(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : (allowedOrigin || 'null'),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin'
  };
}
