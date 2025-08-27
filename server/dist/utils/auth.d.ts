/**
 * Authentication utilities
 */
export interface TokenPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against its hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a JWT token
 */
export declare function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
/**
 * Generate a refresh token
 */
export declare function generateRefreshToken(): string;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): TokenPayload | null;
/**
 * Generate email verification token
 */
export declare function generateEmailVerificationToken(): string;
/**
 * Generate password reset token
 */
export declare function generatePasswordResetToken(): string;
/**
 * Hash SMASH pattern with salt
 */
export declare function hashSmashPattern(pattern: string, salt?: string): {
    hash: string;
    salt: string;
};
/**
 * Verify SMASH pattern against hash
 */
export declare function verifySmashPattern(pattern: string, hash: string, salt: string): boolean;
/**
 * Calculate typing dynamics similarity
 */
export declare function calculateTypingDynamicsSimilarity(stored: {
    averageSpeed: number;
    speedVariance: number;
    keyTimingProfile: number[];
}, current: {
    averageSpeed: number;
    speedVariance: number;
    keyTimingProfile: number[];
}): number;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 */
export declare function isValidPassword(password: string): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=auth.d.ts.map