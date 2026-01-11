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
    maxAmount: Number // Maximum allowed transaction amount
});

const AlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    scheme: String,
    vendor: String, // Ensure this exists for aggregation
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
    timestamp: String,
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
}

export interface IAlert extends mongoose.Document {
    id: string;
    scheme: string;
    vendor: string;
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
    timestamp: string;
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
