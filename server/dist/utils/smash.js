"use strict";
/**
 * SMASH pattern utilities for gesture-based authentication
 * Handles hashing and verification of SMASH patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePattern = normalizePattern;
exports.calculatePatternSimilarity = calculatePatternSimilarity;
exports.hashSmashPattern = hashSmashPattern;
exports.verifySmashPattern = verifySmashPattern;
exports.generatePatternVariations = generatePatternVariations;
exports.validatePatternFormat = validatePatternFormat;
exports.extractPatternFeatures = extractPatternFeatures;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Normalize SMASH pattern coordinates to a consistent grid
 */
function normalizePattern(pattern) {
    // Convert flat array to coordinate pairs
    const points = [];
    for (let i = 0; i < pattern.length; i += 2) {
        if (i + 1 < pattern.length) {
            points.push({
                x: pattern[i],
                y: pattern[i + 1]
            });
        }
    }
    // Normalize to a 100x100 grid
    const normalizedPoints = [];
    for (const point of points) {
        // Normalize coordinates to 0-100 range
        const normalizedX = Math.round((point.x % 1000) / 10);
        const normalizedY = Math.round((point.y % 1000) / 10);
        normalizedPoints.push(normalizedX, normalizedY);
    }
    return normalizedPoints;
}
/**
 * Calculate pattern similarity score
 */
function calculatePatternSimilarity(pattern1, pattern2) {
    const norm1 = normalizePattern(pattern1);
    const norm2 = normalizePattern(pattern2);
    if (norm1.length !== norm2.length) {
        return 0; // Different number of points
    }
    let totalDistance = 0;
    const numPoints = norm1.length / 2;
    for (let i = 0; i < norm1.length; i += 2) {
        const x1 = norm1[i];
        const y1 = norm1[i + 1];
        const x2 = norm2[i];
        const y2 = norm2[i + 1];
        // Calculate Euclidean distance
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        totalDistance += distance;
    }
    // Calculate average distance per point
    const averageDistance = totalDistance / numPoints;
    // Convert to similarity score (0-1, where 1 is identical)
    // Allow up to 10 units of average distance for a perfect match
    const tolerance = 10;
    const similarity = Math.max(0, 1 - (averageDistance / tolerance));
    return similarity;
}
/**
 * Hash SMASH pattern with salt
 */
function hashSmashPattern(pattern, salt) {
    // Normalize the pattern first
    const normalizedPattern = normalizePattern(pattern);
    // Convert to string representation
    const patternString = normalizedPattern.join(',');
    // Hash with salt using PBKDF2
    const hash = crypto_1.default.pbkdf2Sync(patternString, salt, 10000, 64, 'sha256');
    return hash.toString('hex');
}
/**
 * Verify SMASH pattern against stored hash
 */
function verifySmashPattern(inputPattern, storedHash, salt, tolerance = 0.8 // Minimum similarity score required
) {
    try {
        // First, try exact match
        const inputHash = hashSmashPattern(inputPattern, salt);
        if (inputHash === storedHash) {
            return true;
        }
        // If exact match fails, we need to implement fuzzy matching
        // For now, we'll use a tolerance-based approach
        // In a production system, you might want to store multiple variations
        // or use more sophisticated pattern matching algorithms
        return false; // For exact matching only in this implementation
    }
    catch (error) {
        console.error('Error verifying SMASH pattern:', error);
        return false;
    }
}
/**
 * Generate pattern variations for training data
 * This can be used to create multiple acceptable versions of a pattern
 */
function generatePatternVariations(pattern, variationCount = 5) {
    const variations = [];
    for (let i = 0; i < variationCount; i++) {
        const variation = pattern.map(coord => {
            // Add small random variation (±5% of coordinate value)
            const variation = (Math.random() - 0.5) * 0.1 * coord;
            return Math.round(coord + variation);
        });
        variations.push(variation);
    }
    return variations;
}
/**
 * Validate SMASH pattern format
 */
function validatePatternFormat(pattern) {
    if (!Array.isArray(pattern)) {
        return { isValid: false, error: 'Pattern must be an array' };
    }
    if (pattern.length < 6) { // At least 3 points (x,y pairs)
        return { isValid: false, error: 'Pattern must have at least 3 points' };
    }
    if (pattern.length % 2 !== 0) {
        return { isValid: false, error: 'Pattern must have even number of coordinates (x,y pairs)' };
    }
    // Check if all values are numbers
    for (const coord of pattern) {
        if (typeof coord !== 'number' || isNaN(coord)) {
            return { isValid: false, error: 'All coordinates must be valid numbers' };
        }
    }
    // Check coordinate ranges (should be reasonable screen coordinates)
    for (let i = 0; i < pattern.length; i += 2) {
        const x = pattern[i];
        const y = pattern[i + 1];
        if (x < 0 || x > 10000 || y < 0 || y > 10000) {
            return { isValid: false, error: 'Coordinates must be within reasonable screen bounds' };
        }
    }
    return { isValid: true };
}
/**
 * Extract pattern features for analysis
 */
function extractPatternFeatures(pattern) {
    const normalized = normalizePattern(pattern);
    const pointCount = normalized.length / 2;
    let totalDistance = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < normalized.length; i += 2) {
        const x = normalized[i];
        const y = normalized[i + 1];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        if (i > 0) {
            const prevX = normalized[i - 2];
            const prevY = normalized[i - 1];
            const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
            totalDistance += distance;
        }
    }
    return {
        pointCount,
        totalDistance,
        averageSpeed: totalDistance / Math.max(1, pointCount - 1),
        boundingBox: {
            width: maxX - minX,
            height: maxY - minY
        }
    };
}
//# sourceMappingURL=smash.js.map