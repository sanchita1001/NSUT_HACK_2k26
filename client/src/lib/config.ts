// Centralized API configuration with environment variable support
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,

    // Alerts
    ALERTS: `${API_BASE_URL}/alerts`,
    ALERT_STATS: `${API_BASE_URL}/alerts/stats`,
    ALERT_BY_ID: (id: string) => `${API_BASE_URL}/alerts/${id}`,
    ALERT_STATUS: (id: string) => `${API_BASE_URL}/alerts/${id}/status`,

    // Analytics
    ANALYTICS_PREDICTIVE: `${API_BASE_URL}/analytics/predictive`,
    ANALYTICS_CLUSTERS: `${API_BASE_URL}/analytics/clusters`,
    ANALYTICS_REPORT: `${API_BASE_URL}/analytics/report`,

    // Vendors
    VENDORS: `${API_BASE_URL}/vendors`,
    VENDOR_BY_ID: (id: string) => `${API_BASE_URL}/vendors/${id}`,
    VENDOR_RISK_PROFILE: (id: string) => `${API_BASE_URL}/vendors/${id}/risk-profile`,

    // Schemes
    SCHEMES: `${API_BASE_URL}/schemes`,

    // Network
    NETWORK: (id: string) => `${API_BASE_URL}/network/${id}`,

    // Audit
    AUDIT_LOGS: `${API_BASE_URL}/audit-logs`,
};

// Helper function for API calls with proper error handling
export async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', endpoint, error);
        throw error;
    }
}
