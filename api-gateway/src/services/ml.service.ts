import axios from 'axios';

export class MLService {
    private static ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    static async predictFraud(data: { amount: number; agency: string; vendor: string }) {
        try {
            console.log(`[ML Service] Sending request to ${this.ML_URL}/predict`, data);
            const response = await axios.post(`${this.ML_URL}/predict`, {
                amount: data.amount,
                agency: data.agency,
                vendor: data.vendor
            }, { timeout: 5000 }); // 5s timeout

            return {
                riskScore: response.data.risk_score,
                mlReasons: response.data.reasons,
                isAnomaly: response.data.is_anomaly,
                available: true
            };
        } catch (error: any) {
            console.error("[ML Service] Prediction Failed:", error.message);
            // Fallback Logic
            let fallbackScore = 15;
            let fallbackReasons = ["ML Service Unavailable - Default check"];

            if (data.amount > 500000) {
                fallbackScore = 60;
                fallbackReasons.push("High Value Transaction (Fallback)");
            }

            return {
                riskScore: fallbackScore,
                mlReasons: fallbackReasons,
                isAnomaly: false,
                available: false
            };
        }
    }

    static async generateVendorProfile(
        data: { amount: number; agency: string; vendor: string; transaction_time?: string },
        vendorContext?: {
            totalTransactions: number;
            averageAmount: number;
            totalVolume: number;
            highRiskCount: number;
            averageRiskScore: number;
            recentTransactions: any[];
        }
    ) {
        try {
            console.log(`[ML Service] Generating vendor profile for ${data.vendor}/${data.agency}`);

            // Format request to match ML service Transaction model
            const requestBody = {
                amount: data.amount,
                agency: data.agency,
                vendor: data.vendor,
                transaction_time: data.transaction_time || new Date().toISOString()
            };

            const response = await axios.post(`${this.ML_URL}/generate-profile`, requestBody, {
                timeout: 60000 // 60s timeout for LLM generation (Ollama can be slow)
            });

            return response.data;
        } catch (error: any) {
            console.error("[ML Service] Profile Generation Failed:", error.message);

            // Check if it's an Ollama-specific error
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (detail.includes('Ollama') || detail.includes('ollama')) {
                    throw new Error("Ollama service is unavailable. Please ensure Ollama is running with 'ollama serve'.");
                }
            }

            // Generic error
            throw new Error(error.response?.data?.detail || "Failed to generate vendor profile. ML service may be unavailable.");
        }
    }

    static async getVendorHistory(vendor: string) {
        try {
            console.log(`[ML Service] Fetching vendor history for ${vendor} from JSONL`);
            const response = await axios.get(`${this.ML_URL}/vendor-history/${encodeURIComponent(vendor)}`, {
                timeout: 5000
            });

            return response.data;
        } catch (error: any) {
            console.error("[ML Service] Vendor History Failed:", error.message);
            throw new Error("Failed to fetch vendor history");
        }
    }
}
