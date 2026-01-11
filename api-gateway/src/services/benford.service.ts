import { IVendor } from '../models';

/**
 * Benford's Law Fraud Detection Service
 * Analyzes first digit distribution to detect fabricated numbers
 */

export class BenfordService {

    /**
     * Expected Benford's Law distribution for first digits
     */
    private static readonly BENFORD_DISTRIBUTION = {
        1: 0.301,
        2: 0.176,
        3: 0.125,
        4: 0.097,
        5: 0.079,
        6: 0.067,
        7: 0.058,
        8: 0.051,
        9: 0.046
    };

    /**
     * Check if amount follows Benford's Law
     * Returns risk increase if suspicious
     */
    static checkAmount(amount: number): { violation: boolean; riskIncrease: number; reason?: string } {
        const amountStr = Math.floor(amount).toString();
        const firstDigit = parseInt(amountStr[0]);

        // Benford's Law doesn't apply to small numbers or numbers starting with 0
        if (amount < 100 || firstDigit === 0) {
            return { violation: false, riskIncrease: 0 };
        }

        // Get expected probability for this first digit
        const expectedProb = this.BENFORD_DISTRIBUTION[firstDigit as keyof typeof this.BENFORD_DISTRIBUTION];

        // Digits 1-3 are most common in natural data
        // Digits 7-9 are least common
        // Flag if amount starts with unlikely digits
        if (firstDigit >= 7) {
            return {
                violation: true,
                riskIncrease: 10,
                reason: `Amount starts with ${firstDigit} (Benford's Law: unlikely first digit)`
            };
        }

        return { violation: false, riskIncrease: 0 };
    }

    /**
     * Analyze multiple amounts for Benford's Law compliance
     * Used for vendor history analysis
     */
    static analyzeAmounts(amounts: number[]): {
        compliant: boolean;
        chiSquare: number;
        suspiciousDigits: number[];
    } {
        if (amounts.length < 10) {
            // Need at least 10 samples for statistical significance
            return { compliant: true, chiSquare: 0, suspiciousDigits: [] };
        }

        const digitCounts: { [key: number]: number } = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
        };

        // Count first digits
        amounts.forEach(amount => {
            const firstDigit = parseInt(Math.floor(amount).toString()[0]);
            if (firstDigit >= 1 && firstDigit <= 9) {
                digitCounts[firstDigit]++;
            }
        });

        // Calculate chi-square statistic
        let chiSquare = 0;
        const suspiciousDigits: number[] = [];

        for (let digit = 1; digit <= 9; digit++) {
            const observed = digitCounts[digit];
            const expected = amounts.length * this.BENFORD_DISTRIBUTION[digit as keyof typeof this.BENFORD_DISTRIBUTION];

            chiSquare += Math.pow(observed - expected, 2) / expected;

            // Flag digits with significant deviation
            const deviation = Math.abs(observed - expected) / expected;
            if (deviation > 0.5) {
                suspiciousDigits.push(digit);
            }
        }

        // Chi-square critical value for 8 degrees of freedom at 95% confidence is 15.51
        const compliant = chiSquare < 15.51;

        return { compliant, chiSquare, suspiciousDigits };
    }
}
