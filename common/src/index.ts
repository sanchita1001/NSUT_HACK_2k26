export enum UserRole {
    OFFICER = 'OFFICER',
    SUPERVISOR = 'SUPERVISOR',
    AUDITOR = 'AUDITOR',
    VIGILANCE = 'VIGILANCE',
    ADMIN = 'ADMIN'
}

export enum TransactionState {
    INITIATED = 'INITIATED',
    PARTIALLY_RELEASED = 'PARTIALLY_RELEASED',
    CORRECTED = 'CORRECTED',
    REVERSED = 'REVERSED',
    ADJUSTED = 'ADJUSTED',
    FINALIZED = 'FINALIZED'
}

export interface Transaction {
    id: string;
    amount: number;
    currency: string;
    vendorId: string;
    schemeId: string;
    state: TransactionState;
    timestamp: string;
    metadata: Record<string, any>;
}

export enum RiskLevel {
    INFORMATIONAL = 'INFORMATIONAL',
    WATCHLIST = 'WATCHLIST',
    REVIEW_REQUIRED = 'REVIEW_REQUIRED',
    HIGH_PRIORITY = 'HIGH_PRIORITY'
}

export interface Alert {
    id: string;
    transactionId: string;
    riskScore: number;
    riskLevel: RiskLevel;
    ruleBreaches: string[];
    mlConfidence: number;
    status: 'OPEN' | 'INVESTIGATING' | 'CLOSED' | 'FALSE_POSITIVE';
    assignedTo?: string; // Officer ID
}

export interface Scheme {
    id: string;
    name: string;
    ministry: string;
    budgetAllocated: number;
    status: 'PILOT' | 'ACTIVE' | 'PAUSED' | 'SUNSET';
    description: string;
}

export interface Vendor {
    id: string;
    name: string;
    gstin: string;
    riskScore: number;
    totalVolume: number;
    flaggedTransactions: number;
    accountStatus: 'ACTIVE' | 'FROZEN' | 'UNDER_WATCH';
    operatingSchemes?: string[];
    paymentBehavior?: string;
    timingToleranceDays?: number;
    maxAmount?: number;
    totalTenderAmount?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
}
