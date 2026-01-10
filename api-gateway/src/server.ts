import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Scheme, Vendor, Alert, AuditLog, User } from './models';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pfms_fraud_db';

// --- Seeding Logic ---
async function seedDatabase() {
    try {
        const schemeCount = await Scheme.countDocuments();
        const vendorCount = await Vendor.countDocuments();
        const alertCount = await Alert.countDocuments();
        const userCount = await User.countDocuments();

        console.log(`🌱 Seeding Check: Schemes=${schemeCount}, Vendors=${vendorCount}, Alerts=${alertCount}, Users=${userCount}`);

        // Seed test user
        if (userCount === 0) {
            console.log("   -> Inserting Test User...");
            await User.create({
                email: 'admin@pfms.gov.in',
                password: 'admin123', // Will be hashed by pre-save hook
                name: 'Admin User',
                role: 'admin'
            });
        }

        if (schemeCount === 0) {
            console.log("   -> Inserting Default Schemes...");
            await Scheme.insertMany([
                { id: "SCH-001", name: "Building and Construction Authority", ministry: "National Development", budgetAllocated: 500000000, status: "ACTIVE", description: "Construction and infrastructure development oversight" },
                { id: "SCH-002", name: "Civil Aviation Authority of Singapore", ministry: "Transport", budgetAllocated: 800000000, status: "ACTIVE", description: "Aviation regulations and airport operations" },
                { id: "SCH-003", name: "Ministry of Culture, Community and Youth", ministry: "Culture", budgetAllocated: 400000000, status: "ACTIVE", description: "Community building and youth engagement" },
                { id: "SCH-004", name: "Agri-food and Veterinary Authority", ministry: "National Development", budgetAllocated: 300000000, status: "ACTIVE", description: "Food safety and security" }
            ]);
        }

        if (vendorCount === 0) {
            console.log("   -> Inserting Default Vendors...");
            await Vendor.insertMany([
                { id: "VEN-991", name: "Agro Tech Supplies", gstin: "09AAACA1234A1Z5", riskScore: 12, totalVolume: 8500000, flaggedTransactions: 0, accountStatus: "ACTIVE" },
                { id: "VEN-882", name: "Rural Infra Builders", gstin: "09BBBCB5678B1Z2", riskScore: 88, totalVolume: 12000000, flaggedTransactions: 14, accountStatus: "UNDER_WATCH" },
                { id: "VEN-773", name: "Direct Beneficiary Transfer", gstin: "NA", riskScore: 0, totalVolume: 500000000, flaggedTransactions: 2, accountStatus: "ACTIVE" },
                { id: "VEN-664", name: "MediCorp Supplies", gstin: "09CCCDC9876C1Z3", riskScore: 45, totalVolume: 4500000, flaggedTransactions: 1, accountStatus: "ACTIVE" }
            ]);
        }

        console.log("✅ Database Seeding Verification Complete");
    } catch (error) {
        console.error("⚠️ Seeding Error:", error);
    }
}

// --- Check Ollama Connection ---
async function checkOllamaConnection() {
    try {
        const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const axios = require('axios');

        const response = await axios.get(ML_SERVICE_URL, { timeout: 3000 });

        if (response.data && response.data.status === 'Active') {
            console.log('✅ Ollama Connected Successfully via ML Service');
            console.log(`   Model: ${response.data.model_version}`);
            console.log(`   Features: Ollama llama3:8b Profiling`);
        }
    } catch (error: any) {
        console.warn('⚠️ Ollama/ML Service Not Available');
        console.warn('   AI summaries will not work. Start ML service: cd ml-service && python ml_model.py');
    }
}

// --- Server Start ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log(`Connected to MongoDB at ${MONGO_URI}`);
        await seedDatabase();
        await checkOllamaConnection();

        app.listen(PORT, () => {
            console.log(`🚀 API Gateway running on port ${PORT}`);
            console.log(`📡 URL: http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error("❌ MongoDB Connection Failed:", err));
