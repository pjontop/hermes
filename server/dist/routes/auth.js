"use strict";
/**
 * Authentication routes for Hermes Chat
 * Handles user signup, login, SMASH verification, and session management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../generated/prisma");
const encryption_1 = require("../utils/encryption");
const smash_1 = require("../utils/smash");
const router = (0, express_1.Router)();
const prisma = new prisma_1.PrismaClient();
// Helper function to generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_me', { expiresIn: '7d' });
};
// Helper function to generate refresh token
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
/**
 * POST /api/auth/signup
 * Register a new user account
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, name, password } = req.body;
        // Validate input
        if (!email || !name || !password) {
            return res.status(400).json({
                error: 'Email, name, and password are required'
            });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Generate RSA key pair for E2E encryption
        const { publicKey, privateKey } = await (0, encryption_1.generateRSAKeyPair)();
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                publicKey,
                signupStep: 1 // Step 1: Account created, need SMASH setup
            }
        });
        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken();
        // Create auth session
        await prisma.authSession.create({
            data: {
                userId: user.id,
                token,
                refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                signupStep: user.signupStep,
                isEmailVerified: user.isEmailVerified
            },
            tokens: {
                accessToken: token,
                refreshToken,
                privateKey // Send private key securely for local storage
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Internal server error during signup'
        });
    }
});
/**
 * POST /api/auth/login
 * Login with email/password or SMASH pattern
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, smashPattern } = req.body;
        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                smashPatterns: true
            }
        });
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        let isValidAuth = false;
        // Check password authentication
        if (password && user.passwordHash) {
            isValidAuth = await bcryptjs_1.default.compare(password, user.passwordHash);
        }
        // Check SMASH pattern authentication
        if (smashPattern && user.smashPatterns.length > 0) {
            const smashRecord = user.smashPatterns[0]; // Get the latest pattern
            if (smashRecord.isLocked && smashRecord.lockedUntil && smashRecord.lockedUntil > new Date()) {
                return res.status(423).json({
                    error: 'Account temporarily locked due to too many failed attempts',
                    lockedUntil: smashRecord.lockedUntil
                });
            }
            const smashValid = (0, smash_1.verifySmashPattern)(smashPattern, smashRecord.patternHash, smashRecord.salt);
            if (smashValid) {
                isValidAuth = true;
                // Reset failed attempts on successful login
                await prisma.smashPattern.update({
                    where: { id: smashRecord.id },
                    data: {
                        attempts: 0,
                        isLocked: false,
                        lockedUntil: null
                    }
                });
            }
            else {
                // Increment failed attempts
                const newAttempts = smashRecord.attempts + 1;
                const shouldLock = newAttempts >= smashRecord.maxAttempts;
                await prisma.smashPattern.update({
                    where: { id: smashRecord.id },
                    data: {
                        attempts: newAttempts,
                        isLocked: shouldLock,
                        lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 minutes lock
                    }
                });
                if (shouldLock) {
                    return res.status(423).json({
                        error: 'Too many failed attempts. Account locked for 15 minutes.'
                    });
                }
            }
        }
        if (!isValidAuth) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken();
        // Create new auth session
        await prisma.authSession.create({
            data: {
                userId: user.id,
                token,
                refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                signupStep: user.signupStep,
                isEmailVerified: user.isEmailVerified
            },
            tokens: {
                accessToken: token,
                refreshToken
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error during login'
        });
    }
});
/**
 * POST /api/auth/smash/setup
 * Set up SMASH pattern for a user
 */
router.post('/smash/setup', async (req, res) => {
    try {
        const { pattern } = req.body;
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        if (!pattern || !Array.isArray(pattern) || pattern.length < 3) {
            return res.status(400).json({
                error: 'SMASH pattern must be an array with at least 3 points'
            });
        }
        // Generate salt and hash the pattern
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const patternHash = (0, smash_1.hashSmashPattern)(pattern, salt);
        // Remove existing patterns for this user
        await prisma.smashPattern.deleteMany({
            where: { userId: req.user.id }
        });
        // Create new pattern
        await prisma.smashPattern.create({
            data: {
                userId: req.user.id,
                patternHash,
                salt
            }
        });
        // Update user signup step
        await prisma.user.update({
            where: { id: req.user.id },
            data: { signupStep: 2 } // Step 2: SMASH pattern set up
        });
        res.json({
            message: 'SMASH pattern set up successfully'
        });
    }
    catch (error) {
        console.error('SMASH setup error:', error);
        res.status(500).json({
            error: 'Internal server error during SMASH setup'
        });
    }
});
/**
 * POST /api/auth/smash/verify
 * Verify SMASH pattern
 */
router.post('/smash/verify', async (req, res) => {
    try {
        const { pattern } = req.body;
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        if (!pattern || !Array.isArray(pattern)) {
            return res.status(400).json({
                error: 'Invalid SMASH pattern format'
            });
        }
        // Get user's SMASH pattern
        const smashRecord = await prisma.smashPattern.findFirst({
            where: { userId: req.user.id }
        });
        if (!smashRecord) {
            return res.status(404).json({
                error: 'No SMASH pattern found for this user'
            });
        }
        // Check if account is locked
        if (smashRecord.isLocked && smashRecord.lockedUntil && smashRecord.lockedUntil > new Date()) {
            return res.status(423).json({
                error: 'Account temporarily locked due to too many failed attempts',
                lockedUntil: smashRecord.lockedUntil
            });
        }
        // Verify pattern
        const isValid = (0, smash_1.verifySmashPattern)(pattern, smashRecord.patternHash, smashRecord.salt);
        if (isValid) {
            // Reset failed attempts
            await prisma.smashPattern.update({
                where: { id: smashRecord.id },
                data: {
                    attempts: 0,
                    isLocked: false,
                    lockedUntil: null
                }
            });
            res.json({
                message: 'SMASH pattern verified successfully',
                valid: true
            });
        }
        else {
            // Increment failed attempts
            const newAttempts = smashRecord.attempts + 1;
            const shouldLock = newAttempts >= smashRecord.maxAttempts;
            await prisma.smashPattern.update({
                where: { id: smashRecord.id },
                data: {
                    attempts: newAttempts,
                    isLocked: shouldLock,
                    lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null
                }
            });
            res.status(401).json({
                message: 'Invalid SMASH pattern',
                valid: false,
                attemptsRemaining: shouldLock ? 0 : smashRecord.maxAttempts - newAttempts,
                locked: shouldLock
            });
        }
    }
    catch (error) {
        console.error('SMASH verification error:', error);
        res.status(500).json({
            error: 'Internal server error during SMASH verification'
        });
    }
});
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token is required'
            });
        }
        // Find session with this refresh token
        const session = await prisma.authSession.findUnique({
            where: { refreshToken },
            include: { user: true }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return res.status(401).json({
                error: 'Invalid or expired refresh token'
            });
        }
        // Generate new tokens
        const newAccessToken = generateToken(session.userId);
        const newRefreshToken = generateRefreshToken();
        // Update session
        await prisma.authSession.update({
            where: { id: session.id },
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        res.json({
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Internal server error during token refresh'
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            // Deactivate session
            await prisma.authSession.updateMany({
                where: {
                    userId: req.user.id,
                    token,
                    isActive: true
                },
                data: { isActive: false }
            });
        }
        res.json({
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error during logout'
        });
    }
});
/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                publicKey: true,
                isEmailVerified: true,
                signupStep: true,
                lastLoginAt: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map