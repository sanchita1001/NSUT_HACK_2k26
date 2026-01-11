import { IVendor, IAlert } from '../models';

/**
 * Payment Behavior Patterns and Validation Rules
 * Separated into its own service for maintainability and debugging
 */

export enum PaymentBehavior {
    REGULAR = 'REGULAR',       // Monthly payments
    QUARTERLY = 'QUARTERLY',   // Every 3 months
    MILESTONE = 'MILESTONE',   // Project-based payments
    IRREGULAR = 'IRREGULAR'    // Ad-hoc, no pattern
}

export interface PaymentValidationResult {
    isValid: boolean;
    violations: string[];
    riskIncrease: number;
    expectedNextPayment?: Date;
}

export class PaymentBehaviorValidator {

    /**
     * Validate payment based on vendor's declared payment behavior
     */
    static validatePayment(
        vendor: IVendor,
        amount: number,
        lastPaymentDate?: Date
    ): PaymentValidationResult {
        const result: PaymentValidationResult = {
            isValid: true,
            violations: [],
            riskIncrease: 0
        };

        // Validate max amount if set
        if (vendor.maxAmount && amount > vendor.maxAmount) {
            result.isValid = false;
            result.violations.push(
                `Amount ₹${amount.toLocaleString()} exceeds vendor max limit of ₹${vendor.maxAmount.toLocaleString()}`
            );
            result.riskIncrease += 30;
        }

        // Validate payment behavior pattern
        if (!lastPaymentDate) {
            // First payment - no pattern to validate
            result.expectedNextPayment = this.calculateNextExpectedPayment(
                new Date(),
                vendor.paymentBehavior || PaymentBehavior.IRREGULAR,
                vendor.timingToleranceDays || 0
            );
            return result;
        }

        const daysSinceLastPayment = this.getDaysBetween(lastPaymentDate, new Date());
        const behavior = vendor.paymentBehavior || PaymentBehavior.IRREGULAR;
        const tolerance = vendor.timingToleranceDays || 0;

        switch (behavior) {
            case PaymentBehavior.REGULAR:
                return this.validateRegularPayment(daysSinceLastPayment, tolerance, result);

            case PaymentBehavior.QUARTERLY:
                return this.validateQuarterlyPayment(daysSinceLastPayment, tolerance, result);

            case PaymentBehavior.MILESTONE:
                return this.validateMilestonePayment(daysSinceLastPayment, tolerance, result);

            case PaymentBehavior.IRREGULAR:
                return this.validateIrregularPayment(daysSinceLastPayment, result);

            default:
                return result;
        }
    }

    /**
     * REGULAR Payment Validation
     * Expected: Monthly payments (28-31 days)
     */
    private static validateRegularPayment(
        daysSince: number,
        tolerance: number,
        result: PaymentValidationResult
    ): PaymentValidationResult {
        const expectedDays = 30; // Monthly
        const minDays = expectedDays - tolerance;
        const maxDays = expectedDays + tolerance;

        if (daysSince < minDays) {
            result.violations.push(
                `Payment too early: ${daysSince} days since last payment (expected ${minDays}-${maxDays} days)`
            );
            result.riskIncrease += 15;
        } else if (daysSince > maxDays) {
            result.violations.push(
                `Payment delayed: ${daysSince} days since last payment (expected ${minDays}-${maxDays} days)`
            );
            result.riskIncrease += 10;
        }

        result.expectedNextPayment = new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000);
        return result;
    }

    /**
     * QUARTERLY Payment Validation
     * Expected: Every 3 months (90 days)
     */
    private static validateQuarterlyPayment(
        daysSince: number,
        tolerance: number,
        result: PaymentValidationResult
    ): PaymentValidationResult {
        const expectedDays = 90; // Quarterly
        const minDays = expectedDays - tolerance;
        const maxDays = expectedDays + tolerance;

        if (daysSince < minDays) {
            result.violations.push(
                `Quarterly payment too early: ${daysSince} days since last payment (expected ${minDays}-${maxDays} days)`
            );
            result.riskIncrease += 20;
        } else if (daysSince > maxDays) {
            result.violations.push(
                `Quarterly payment delayed: ${daysSince} days since last payment (expected ${minDays}-${maxDays} days)`
            );
            result.riskIncrease += 10;
        }

        result.expectedNextPayment = new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000);
        return result;
    }

    /**
     * MILESTONE Payment Validation
     * Expected: Project-based, irregular but with justification
     * More lenient on timing, stricter on amount consistency
     */
    private static validateMilestonePayment(
        daysSince: number,
        tolerance: number,
        result: PaymentValidationResult
    ): PaymentValidationResult {
        // Milestone payments can vary widely, but very frequent payments are suspicious
        if (daysSince < 7) {
            result.violations.push(
                `Milestone payment too frequent: ${daysSince} days since last payment (minimum 7 days expected)`
            );
            result.riskIncrease += 25;
        }

        // Very long gaps might indicate project completion
        if (daysSince > 180) {
            result.violations.push(
                `Very long gap since last milestone payment: ${daysSince} days (possible new project)`
            );
            result.riskIncrease += 5; // Low risk, just informational
        }

        // No specific next payment date for milestones
        return result;
    }

    /**
     * IRREGULAR Payment Validation
     * Expected: Ad-hoc payments, no pattern
     * Only flag extremely frequent payments
     */
    private static validateIrregularPayment(
        daysSince: number,
        result: PaymentValidationResult
    ): PaymentValidationResult {
        // Only flag if payments are suspiciously frequent
        if (daysSince < 1) {
            result.violations.push(
                `Multiple payments on same day (irregular pattern)`
            );
            result.riskIncrease += 20;
        } else if (daysSince < 3) {
            result.violations.push(
                `Very frequent payments: ${daysSince} days since last payment`
            );
            result.riskIncrease += 10;
        }

        // No expected next payment for irregular
        return result;
    }

    /**
     * Calculate expected next payment date based on behavior
     */
    private static calculateNextExpectedPayment(
        lastPayment: Date,
        behavior: string,
        tolerance: number
    ): Date | undefined {
        const baseDate = new Date(lastPayment);

        switch (behavior) {
            case PaymentBehavior.REGULAR:
                baseDate.setDate(baseDate.getDate() + 30);
                return baseDate;

            case PaymentBehavior.QUARTERLY:
                baseDate.setDate(baseDate.getDate() + 90);
                return baseDate;

            case PaymentBehavior.MILESTONE:
            case PaymentBehavior.IRREGULAR:
            default:
                return undefined; // No predictable next payment
        }
    }

    /**
     * Helper: Calculate days between two dates
     */
    private static getDaysBetween(date1: Date, date2: Date): number {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get human-readable description of payment behavior
     */
    static getPaymentBehaviorDescription(behavior: string): string {
        switch (behavior) {
            case PaymentBehavior.REGULAR:
                return 'Monthly payments (30 days ± tolerance)';
            case PaymentBehavior.QUARTERLY:
                return 'Quarterly payments (90 days ± tolerance)';
            case PaymentBehavior.MILESTONE:
                return 'Project-based milestone payments (variable timing)';
            case PaymentBehavior.IRREGULAR:
                return 'Ad-hoc payments (no fixed pattern)';
            default:
                return 'Unknown payment pattern';
        }
    }
}
