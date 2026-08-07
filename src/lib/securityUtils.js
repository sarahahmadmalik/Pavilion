/**
 * Security & Input Validation Utilities
 * =====================================
 * Provides XSS sanitization, CSRF/Injection prevention, and form validation routines.
 */

/**
 * Strips HTML tags and unsafe script characters to prevent stored/reflected XSS.
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script blocks
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Prevent JS URLs
    .replace(/on\w+="[^"]*"/gi, '') // Prevent inline event handlers
    .replace(/on\w+='[^']*'/gi, '')
    .trim();
}

/**
 * Recursively sanitizes all text fields in a form data object.
 */
export function sanitizeFormData(data) {
  if (!data || typeof data !== 'object') return data;
  const cleaned = Array.isArray(data) ? [] : {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      cleaned[key] = sanitizeInput(data[key]);
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      cleaned[key] = sanitizeFormData(data[key]);
    } else {
      cleaned[key] = data[key];
    }
  }
  return cleaned;
}

/**
 * Validates standard email address syntax.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validates positive monetary amounts or item quantities.
 */
export function validatePositiveNumber(num, fieldName = 'Amount') {
  const parsed = Number(num);
  if (isNaN(parsed)) return `${fieldName} must be a valid numeric value.`;
  if (parsed < 0) return `${fieldName} cannot be negative.`;
  return null;
}

/**
 * Validates that all required object keys exist and are non-empty strings/values.
 */
export function validateRequiredFields(formData, requiredFieldsMap) {
  const errors = [];
  for (const [key, label] of Object.entries(requiredFieldsMap)) {
    const val = formData[key];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      errors.push(`${label} is required.`);
    }
  }
  return errors;
}
