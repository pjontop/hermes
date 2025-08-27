/**
 * SMASH pattern utilities for gesture-based authentication
 * Handles hashing and verification of SMASH patterns
 */
/**
 * Interface for SMASH pattern point
 */
export interface SmashPoint {
    x: number;
    y: number;
    timestamp: number;
}
/**
 * Normalize SMASH pattern coordinates to a consistent grid
 */
export declare function normalizePattern(pattern: number[]): number[];
/**
 * Calculate pattern similarity score
 */
export declare function calculatePatternSimilarity(pattern1: number[], pattern2: number[]): number;
/**
 * Hash SMASH pattern with salt
 */
export declare function hashSmashPattern(pattern: number[], salt: string): string;
/**
 * Verify SMASH pattern against stored hash
 */
export declare function verifySmashPattern(inputPattern: number[], storedHash: string, salt: string, tolerance?: number): boolean;
/**
 * Generate pattern variations for training data
 * This can be used to create multiple acceptable versions of a pattern
 */
export declare function generatePatternVariations(pattern: number[], variationCount?: number): number[][];
/**
 * Validate SMASH pattern format
 */
export declare function validatePatternFormat(pattern: number[]): {
    isValid: boolean;
    error?: string;
};
/**
 * Extract pattern features for analysis
 */
export declare function extractPatternFeatures(pattern: number[]): {
    pointCount: number;
    totalDistance: number;
    averageSpeed: number;
    boundingBox: {
        width: number;
        height: number;
    };
};
//# sourceMappingURL=smash.d.ts.map