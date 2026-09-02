import path from 'path';

// Enforce JWT_SECRET fail-fast check at startup
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing. Server cannot start in production without a secret key.');
  }
}

if (JWT_SECRET && JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET is too weak. Minimum required secret length is 32 characters.');
}

// Fallback secret ONLY allowed in local dev mode if process.env.JWT_SECRET is explicitly omitted
export const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'studygenie_dev_only_super_secret_jwt_key_minimum_32_chars_2026';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
export const PORT = Number(process.env.PORT) || 3000;
