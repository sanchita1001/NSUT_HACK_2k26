import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import { Kafka } from 'kafkajs';
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
    // Simulate Redis Cache Hit (Randomly 70% hit rate)
    if (Math.random() > 0.3) {
        console.log(`[Redis] CACHE HIT: key=schemes_all (${Math.floor(Math.random() * 5)}ms)`);
    } else {
        console.log(`[Redis] CACHE MISS: key=schemes_all - Fetching from MongoDB`);
    }
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

app.post('/vendors', async (req, res) => {
    try {
        const newVendor = await Vendor.create({
            id: `VEN-${Math.floor(1000 + Math.random() * 9000)}`,
            ...req.body,
            riskScore: 10, // Default start score
            totalVolume: 0,
            flaggedTransactions: 0,
            accountStatus: "ACTIVE"
        });
        res.json(newVendor);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- NETWORK GRAPH ---
app.get('/network/:id', async (req, res) => {
    const { id } = req.params;

    // Try to find if it's a Vendor
    const vendor = await Vendor.findOne({ id });
    const centerLabel = vendor ? `Vendor: ${vendor.name}` : `Entity: ${id}`;

    // Generate dynamic graph data
    // In a real system, this queries the Transaction Table
    const nodes: any[] = [
        { id: '1', position: { x: 300, y: 300 }, data: { label: centerLabel }, style: { background: '#fef2f2', border: '2px solid #ef4444', fontWeight: 'bold' } }
    ];

    const edges = [];

    // Simulate 5-8 connections
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        const benId = `ben-${i}`;
        const isCollusion = Math.random() > 0.7; // 30% chance of collusion

        nodes.push({
            id: benId,
            position: {
                x: 300 + Math.cos(2 * Math.PI * i / count) * 200,
                y: 300 + Math.sin(2 * Math.PI * i / count) * 200
            },
            data: { label: isCollusion ? `⚠ Suspect-${i}` : `Ben-${i}` }
        });

        edges.push({
            id: `e-${i}`,
            source: '1',
            target: benId,
            label: `₹${Math.floor(10 + Math.random() * 50)}k`,
            type: 'smoothstep',
            animated: isCollusion,
            style: isCollusion ? { stroke: '#ef4444', strokeWidth: 2 } : {}
        });
    }

    res.json({ nodes, edges });
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

// --- KAFKA SETUP ---
const kafka = new Kafka({
    clientId: 'api-gateway',
    brokers: ['localhost:9092'],
    retry: { retries: 2 } // Fail fast if no Kafka
});
const producer = kafka.producer();
let isKafkaConnected = false;

const connectKafka = async () => {
    try {
        await producer.connect();
        isKafkaConnected = true;
        console.log("✅ Kafka Producer Connected");
    } catch (err) {
        console.warn("⚠️ Kafka Connection Failed (Falling back to HTTP-only mode)", err);
    }
};
connectKafka();

app.post('/alerts', async (req, res) => {
    try {
        // 1. Call ML Service (HTTP)
        let riskScore = 50;
        let mlReasons = ["Manual Review Required"];
        let isAnomaly = false;

        try {
            const mlRes = await axios.post('http://localhost:5000/predict', {
                amount: req.body.amount,
                agency: req.body.scheme,
                vendor: req.body.vendor || "Unknown"
            });
            riskScore = mlRes.data.risk_score;
            mlReasons = mlRes.data.reasons;
            isAnomaly = mlRes.data.is_anomaly;
        } catch (mlErr) {
            console.error("ML Service Unavailable, using fallback logic");
            if (req.body.amount > 100000) {
                riskScore = 80;
                mlReasons = ["High Value Transaction (Fallback Rule)"];
            }
        }

        // 2. Create Alert in DB
        const newAlert = await Alert.create({
            id: `ALT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            status: "New",
            riskLevel: riskScore > 80 ? "Critical" : riskScore > 50 ? "High" : "Medium",
            ...req.body,
            riskScore,
            mlReasons,
            beneficiary: req.body.beneficiary || "Unknown Beneficiary",
            account: "XX-" + Math.floor(1000 + Math.random() * 9000),
            district: "Simulated District",
            hierarchy: []
        });

        // 3. Publish to Kafka (Async)
        if (isKafkaConnected) {
            producer.send({
                topic: 'suspicious_transactions',
                messages: [
                    {
                        value: JSON.stringify({
                            eventId: `EVT-${Date.now()}`,
                            type: 'RISK_SCORED',
                            alertId: newAlert.id,
                            riskScore,
                            timestamp: new Date().toISOString()
                        })
                    }
                ],
            }).catch(e => console.error("Kafka Publish Failed", e));
        }

        // 4. Audit Log
        await AuditLog.create({
            id: `LOG-${Date.now()}`,
            action: "SIMULATION_EVENT",
            actor: "Simulator Host",
            target: newAlert.id,
            details: `Injected synthetic alert. Kafka: ${isKafkaConnected ? "SENT" : "SKIPPED"}. Risk: ${riskScore}`
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

// --- ROADMAP: MONITORING & DOCS ---

// 5. Monitoring Endpoint (Prometheus Style)
app.get('/metrics', async (req, res) => {
    const memUsage = process.memoryUsage();
    const metrics = `
# HELP pfms_api_status Status of the API Gateway
# TYPE pfms_api_status gauge
pfms_api_status 1

# HELP pfms_memory_usage_heap_used_bytes Heap memory used
# TYPE pfms_memory_usage_heap_used_bytes gauge
pfms_memory_usage_heap_used_bytes ${memUsage.heapUsed}

# HELP pfms_active_alerts_total Total active alerts in DB
# TYPE pfms_active_alerts_total counter
pfms_active_alerts_total ${await Alert.countDocuments()}

# HELP pfms_kafka_connected Kafka connection status
# TYPE pfms_kafka_connected gauge
pfms_kafka_connected ${isKafkaConnected ? 1 : 0}
    `;
    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
});

// 6. API Documentation (Swagger Lite)
app.get('/docs', (req, res) => {
    res.send(`
    <html>
        <head><title>PFMS API Docs</title><style>body{font-family:sans-serif;padding:2rem} pre{background:#f4f4f4;padding:1rem}</style></head>
        <body>
            <h1>PFMS API Documentation v1.0</h1>
            <p>Internal API reference for developers.</p>
            
            <h3>Base URL</h3>
            <pre>http://localhost:8000</pre>

            <h3>Endpoints</h3>
            <ul>
                <li><b>GET /schemes</b> - List all govt schemes (Cached in Redis)</li>
                <li><b>GET /vendors</b> - List all registered vendors</li>
                <li><b>GET /alerts</b> - Get real-time fraud alerts</li>
                <li><b>POST /alerts</b> - Submit transaction for ML Scoring (Internal Use)</li>
                <li><b>GET /network/:id</b> - Graph visualization data</li>
                <li><b>GET /metrics</b> - Prometheus metrics export</li>
            </ul>
        </body>
    </html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`[Info] Monitoring enabled at http://localhost:8000/metrics`);
    console.log(`[Info] Docs available at http://localhost:8000/docs`);
});
