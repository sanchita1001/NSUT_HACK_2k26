import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Scheme, Vendor, Alert, AuditLog } from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
// Use the exact URL provided by user
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pfms_fraud_db';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// --- Database Connection & Seeding ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log(`Connected to MongoDB at ${MONGO_URI}`);
        await seedDatabase();
    })
    .catch(err => console.error("MongoDB Connection Failed:", err));

async function seedDatabase() {
    const schemeCount = await Scheme.countDocuments();
    if (schemeCount === 0) {
        console.log("Seeding Database...");
        await Scheme.insertMany([
            { id: "SCH-001", name: "PM-KISAN", ministry: "Agriculture", budgetAllocated: 60000000000, status: "ACTIVE", description: "Direct income support for farmers" },
            { id: "SCH-002", name: "MGNREGA", ministry: "Rural Development", budgetAllocated: 73000000000, status: "ACTIVE", description: "Employment guarantee scheme" },
            { id: "SCH-003", name: "PMAY-G", ministry: "Housing", budgetAllocated: 20000000000, status: "ACTIVE", description: "Rural housing scheme" }
        ]);
        await Vendor.insertMany([
            { id: "VEN-991", name: "Agro Tech Supplies", gstin: "09AAACA1234A1Z5", riskScore: 12, totalVolume: 8500000, flaggedTransactions: 0, accountStatus: "ACTIVE" },
            { id: "VEN-882", name: "Rural Infra Builders", gstin: "09BBBCB5678B1Z2", riskScore: 88, totalVolume: 12000000, flaggedTransactions: 14, accountStatus: "UNDER_WATCH" },
            { id: "VEN-773", name: "Direct Beneficiary Transfer", gstin: "NA", riskScore: 0, totalVolume: 500000000, flaggedTransactions: 2, accountStatus: "ACTIVE" }
        ]);
        await Alert.insertMany([
            { id: "ALT-2026-908", scheme: "PM-KISAN", riskScore: 92, amount: 1250000, status: "Investigating", riskLevel: "Critical", date: "2026-01-09", beneficiary: "Ramesh Kumar", account: "XX-9021", district: "Sitapur", mlReasons: ["Cluster detection"], hierarchy: [] },
            { id: "ALT-2026-882", scheme: "MGNREGA", riskScore: 78, amount: 45000, status: "New", riskLevel: "High", date: "2026-01-09" }
        ]);
        await AuditLog.insertMany([
            { id: "LOG-9002", action: "ALERT_VIEWED", actor: "Officer Singh", target: "ALT-2026-908", timestamp: new Date(), details: "Viewed alert details" }
        ]);
        console.log("Database Seeded!");
    }
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', mode: 'persistent' });
});

// --- SCHEMES ---
app.get('/schemes', async (req, res) => {
    const schemes = await Scheme.find();
    res.json(schemes);
});
app.post('/schemes', async (req, res) => {
    try {
        const newScheme = await Scheme.create({
            id: `SCH-${Date.now()}`,
            ...req.body,
            status: 'PILOT'
        });
        res.json(newScheme);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- VENDORS ---
app.get('/vendors', async (req, res) => {
    const vendors = await Vendor.find();
    res.json(vendors);
});
app.get('/vendors/:id', async (req, res) => {
    const vendor = await Vendor.findOne({ id: req.params.id });
    if (vendor) res.json(vendor); else res.sendStatus(404);
});

// --- ALERTS ---
app.get('/alerts', async (req, res) => {
    const alerts = await Alert.find();
    res.json(alerts);
});
app.get('/alerts/:id', async (req, res) => {
    const alert = await Alert.findOne({ id: req.params.id });
    if (alert) res.json(alert); else res.sendStatus(404);
});
app.post('/alerts', async (req, res) => {
    try {
        // Simulator sends { scheme, amount, riskScore, ... }
        // We generate ID and timestamp
        const newAlert = await Alert.create({
            id: `ALT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: new Date().toISOString(),
            status: "New",
            riskLevel: req.body.riskScore > 80 ? "Critical" : "High",
            ...req.body,
            // Defaults for simulation
            beneficiary: req.body.beneficiary || "Unknown Beneficiary",
            account: "XX-" + Math.floor(1000 + Math.random() * 9000),
            district: "Simulated District",
            mlReasons: ["Simulation Engine: Pattern Match", "Velocity Check Failed"],
            hierarchy: []
        });

        // Also log this action
        await AuditLog.create({
            id: `LOG-${Date.now()}`,
            action: "SIMULATION_EVENT",
            actor: "Simulator Host",
            target: newAlert.id,
            details: `Injected synthetic fraud alert with risk score ${newAlert.riskScore}`
        });

        res.json(newAlert);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- AUDIT LOGS ---
app.get('/audit-logs', async (req, res) => {
    // Sort by newest first
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json(logs);
});

// Start server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
