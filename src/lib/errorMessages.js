/**
 * Converts technical database, network, or auth errors into clear,
 * plain-English messages suitable for end users (never exposing raw codes).
 */
export function toFriendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  const raw = typeof err === 'string'
    ? err
    : (err.message || err.error_description || err.details || '');
  const code = typeof err === 'object' ? String(err.code || err.status || '') : '';
  const text = `${code} ${raw}`.toLowerCase();

  if (text.includes('failed to fetch') || text.includes('networkerror') || text.includes('network request failed') || text.includes('enotfound')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (code === 'PGRST205' || code === '42P01' || text.includes('schema cache') || text.includes('does not exist')) {
    return 'This feature is not yet configured on the server. Please contact your administrator.';
  }

  if (code === '42501' || text.includes('permission denied') || text.includes('row-level security')) {
    return 'You do not have permission to perform this action.';
  }

  if (code === '23505' || text.includes('duplicate key') || text.includes('already exists')) {
    return 'A record with this information already exists.';
  }

  if (code === '23503' || text.includes('foreign key')) {
    return 'This item is currently linked to other records and cannot be removed.';
  }

  if (text.includes('invalid login credentials') || text.includes('invalid_grant')) {
    return 'Incorrect email or password. Please check your details and try again.';
  }

  if (text.includes('jwt') || text.includes('token') || code === '401') {
    return 'Your session has expired. Please sign in again to continue.';
  }

  if (code === '500' || code === '502' || code === '503' || code === '504' || text.includes('internal server error')) {
    return 'The service is temporarily unavailable. Please try again in a few moments.';
  }

  // Avoid leaking raw technical strings like "{}" or "[object Object]" or SQL syntax
  if (!raw || raw === '{}' || raw === '[object Object]' || /pgrst|postgres|sql|syntax error|unexpected token/i.test(raw)) {
    return fallback;
  }

  return raw;
}
