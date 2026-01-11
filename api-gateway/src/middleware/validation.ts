import Joi from 'joi';

/**
 * Security Fix #5: Comprehensive Input Validation
 * Prevents injection attacks and data corruption
 */

// Alert creation validation
export const alertSchema = Joi.object({
    amount: Joi.number().positive().max(10000000000).required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be positive',
            'number.max': 'Amount cannot exceed 10 billion',
            'any.required': 'Amount is required'
        }),
    scheme: Joi.string().trim().max(200).required()
        .messages({
            'string.max': 'Scheme name too long (max 200 characters)',
            'any.required': 'Scheme is required'
        }),
    vendor: Joi.string().trim().max(200).required()
        .messages({
            'string.max': 'Vendor name/ID too long (max 200 characters)',
            'any.required': 'Vendor is required'
        }),
    beneficiary: Joi.string().trim().max(200).optional().allow(''),
    description: Joi.string().trim().max(500).optional().allow(''),
    district: Joi.string().trim().max(100).optional().allow(''),
    transactionId: Joi.string().trim().max(100).optional()
});

// Vendor creation validation (Security Fix #14: Coordinate validation)
export const vendorSchema = Joi.object({
    id: Joi.string().trim().max(50).required(),
    name: Joi.string().trim().max(200).required(),
    gstin: Joi.string().trim().max(15).optional().allow(''),
    address: Joi.string().trim().max(500).optional().allow(''),
    riskScore: Joi.number().min(0).max(100).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'UNDER_WATCH').optional(),
    latitude: Joi.number().min(-90).max(90).optional()
        .messages({
            'number.min': 'Latitude must be between -90 and 90',
            'number.max': 'Latitude must be between -90 and 90'
        }),
    longitude: Joi.number().min(-180).max(180).optional()
        .messages({
            'number.min': 'Longitude must be between -180 and 180',
            'number.max': 'Longitude must be between -180 and 180'
        }),
    selectedScheme: Joi.string().trim().max(200).optional().allow(''),
    paymentBehavior: Joi.string().valid('REGULAR', 'QUARTERLY', 'MILESTONE', 'IRREGULAR').optional(),
    timingToleranceDays: Joi.number().min(0).max(30).optional()
        .messages({
            'number.min': 'Tolerance cannot be negative',
            'number.max': 'Tolerance cannot exceed 30 days'
        }),
    maxAmount: Joi.number().positive().max(10000000000).optional()
});

// User registration validation (Security Fix #9: Password complexity)
export const userRegistrationSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(12)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Password must be at least 12 characters',
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)',
            'any.required': 'Password is required'
        }),
    name: Joi.string().trim().max(100).required(),
    role: Joi.string().valid('admin', 'auditor', 'analyst', 'viewer').optional()
});

// Login validation
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: any, res: any, next: any) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors
                }
            });
        }

        req.body = value; // Use validated and sanitized data
        next();
    };
};
