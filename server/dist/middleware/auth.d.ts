/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
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
 * Middleware to authenticate JWT tokens
 */
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Legacy middleware for backward compatibility
 */
export declare const authMiddleware: typeof authenticateToken;
/**
 * Middleware to authenticate optional tokens (for routes that work with/without auth)
 */
export declare function authenticateOptionalToken(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware to check if user has completed signup
 */
export declare function requireCompleteSignup(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map