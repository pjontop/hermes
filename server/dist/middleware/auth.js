"use strict";
/**
 * Authentication middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
exports.authenticateToken = authenticateToken;
exports.authenticateOptionalToken = authenticateOptionalToken;
exports.requireCompleteSignup = requireCompleteSignup;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_me';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        return payload;
    }
    catch (error) {
        return null;
    }
}
/**
 * Middleware to authenticate JWT tokens
 */
async function authenticateToken(req, res, next) {
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
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            publicKey: user.publicKey,
            signupStep: user.signupStep
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}
/**
 * Legacy middleware for backward compatibility
 */
exports.authMiddleware = authenticateToken;
/**
 * Middleware to authenticate optional tokens (for routes that work with/without auth)
 */
async function authenticateOptionalToken(req, res, next) {
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
                    req.user = {
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
    }
    catch (error) {
        // Silently continue without authentication for optional auth
        next();
    }
}
/**
 * Middleware to check if user has completed signup
 */
function requireCompleteSignup(req, res, next) {
    const user = req.user;
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
//# sourceMappingURL=auth.js.map