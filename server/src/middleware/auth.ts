/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    publicKey: string;
    signupStep: number;
  };
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_me';
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Verify user still exists and session is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        authSessions: {
          where: {
            token,
            isActive: true,
            expiresAt: { gt: new Date() }
          }
        }
      }
    });

    if (!user || user.authSessions.length === 0) {
      res.status(401).json({ error: 'User not found or session expired' });
      return;
    }

    // Add user to request object
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      publicKey: user.publicKey,
      signupStep: user.signupStep
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Legacy middleware for backward compatibility
 */
export const authMiddleware = authenticateToken;

/**
 * Middleware to authenticate optional tokens (for routes that work with/without auth)
 */
export async function authenticateOptionalToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            authSessions: {
              where: {
                token,
                isActive: true,
                expiresAt: { gt: new Date() }
              }
            }
          }
        });

        if (user && user.authSessions.length > 0) {
          (req as AuthenticatedRequest).user = {
            id: user.id,
            email: user.email,
            name: user.name,
            publicKey: user.publicKey,
            signupStep: user.signupStep
          };
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication for optional auth
    next();
  }
}

/**
 * Middleware to check if user has completed signup
 */
export function requireCompleteSignup(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (user.signupStep < 2) {
    res.status(403).json({ 
      error: 'Signup not complete', 
      signupStep: user.signupStep,
      redirectTo: user.signupStep === 0 ? '/auth/pattern-setup' : '/auth/verify-pattern'
    });
    return;
  }

  next();
}
