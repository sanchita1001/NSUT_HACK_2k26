import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Fix #4: Rate Limiting
 * Prevents brute force attacks and DDoS
 */

// Login rate limiter - strict
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// API rate limiter - moderate
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Alert creation rate limiter - conservative
export const alertCreationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 alerts per minute
    message: 'Too many alert creation requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Security Fix #13: Request Size Limits
 * Prevents memory exhaustion attacks
 */
export const REQUEST_SIZE_LIMIT = '10mb';

/**
 * Security Fix #12: Async Error Handler
 * Catches unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
