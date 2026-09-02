import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EFFECTIVE_JWT_SECRET } from './config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, EFFECTIVE_JWT_SECRET, {
    expiresIn: '7d'
  });
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function extractToken(req: Request): string | null {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.studygenie_token) {
    return req.cookies.studygenie_token;
  }
  // 2. Fallback check for Authorization: Bearer <token> header for external API clients
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

export function requireStrictAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function authenticateUserToken(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as { id: string; email: string; name: string };
      req.user = decoded;
    } catch (err) {
      // Invalid token
    }
  }
  next();
}

// Anti-CSRF Double-Submit Protection Middleware for state-changing methods (POST, PUT, DELETE)
export function verifyCsrfToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for auth login/register endpoints
  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return next();
  }

  // If bearer auth header is provided (e.g. API clients, mobile apps), allow access
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If _csrf cookie is set on client session, enforce double-submit CSRF header matching
  const headerCsrf = req.headers['x-csrf-token'];
  const cookieCsrf = req.cookies ? req.cookies['_csrf'] : null;

  if (cookieCsrf && (!headerCsrf || headerCsrf !== cookieCsrf)) {
    return res.status(403).json({ success: false, error: 'Invalid or missing CSRF token.' });
  }

  next();
}
