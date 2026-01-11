import mongoose from 'mongoose';

const SchemeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    ministry: String,
    budgetAllocated: Number,
    status: String, // 'PILOT' | 'ACTIVE' | 'PAUSED' | 'SUNSET'
    description: String
});

const VendorSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    address: String,
    gstin: String,
    riskScore: Number,
    totalVolume: Number,
    flaggedTransactions: Number,
    accountStatus: String, // 'ACTIVE' | 'FROZEN' | 'UNDER_WATCH'
    latitude: Number,
    longitude: Number,
    operatingSchemes: [String], // List of schemes the vendor is enrolled in
    paymentBehavior: String, // 'REGULAR' | 'QUARTERLY' | 'MILESTONE' | 'IRREGULAR'
    timingToleranceDays: Number, // Permitted deviation in days
    maxAmount: Number, // Maximum allowed PER transaction amount
    totalTenderAmount: Number // Maximum allowed CUMULATIVE amount (Total Contract Value)
});

const AlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    transactionId: { type: String, unique: true, sparse: true }, // For idempotency (Fix #6)
    scheme: String,
    vendor: String, // Legacy field - vendor name
    vendorId: String, // Proper vendor reference by ID (Fix #5)
    riskScore: Number,
    amount: Number,
    status: String,
    riskLevel: String,
    date: String,
    // Detailed fields
    beneficiary: String,
    account: String,
    district: String,
    latitude: Number,
    longitude: Number,
    coordinates: [Number], // [lat, lng] format for geospatial queries
    timestamp: { type: Date, default: Date.now }, // Changed to Date type (Fix #11)
    state: String,
    mlReasons: [String],
    hierarchy: [{ role: String, name: String, status: String, time: String }]
});

const AuditLogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    action: String,
    actor: String,
    target: String,
    timestamp: { type: Date, default: Date.now },
    details: String
});

export interface IScheme extends mongoose.Document {
    id: string;
    name: string;
    ministry: string;
    budgetAllocated: number;
    status: string;
    description: string;
}

export interface IVendor extends mongoose.Document {
    id: string;
    name: string;
    address?: string;
    gstin: string;
    riskScore: number;
    totalVolume: number;
    flaggedTransactions: number;
    accountStatus: string;
    latitude?: number;
    longitude?: number;
    operatingSchemes?: string[];
    paymentBehavior?: string;
    timingToleranceDays?: number;
    maxAmount?: number;
    totalTenderAmount?: number;
}

export interface IAlert extends mongoose.Document {
    id: string;
    transactionId?: string; // For idempotency (Fix #6)
    scheme: string;
    vendor: string; // Legacy - vendor name
    vendorId?: string; // Proper vendor reference (Fix #5)
    riskScore: number;
    amount: number;
    status: string;
    riskLevel: string;
    date: string;
    beneficiary: string;
    account: string;
    district: string;
    latitude?: number;
    longitude?: number;
    coordinates?: number[];
    timestamp: Date; // Changed to Date (Fix #11)
    state: string;
    mlReasons: string[];
    hierarchy: { role: string, name: string, status: string, time: string }[];
}

export interface IAuditLog extends mongoose.Document {
    id: string;
    action: string;
    eventType?: string;
    actor: string;
    target: string;
    timestamp: Date;
    details: string;
}

export const Scheme = mongoose.model<IScheme>('Scheme', SchemeSchema);
export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Export User model
export { User } from './User';
