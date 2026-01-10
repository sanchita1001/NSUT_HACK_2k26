import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { Alert, Scheme } from '../src/models';

describe('Full System Integration Tests', () => {
    let testAlertId: string;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect('mongodb://localhost:27017/pfms_fraud_db');
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    // Test 1: Health Check
    describe('System Health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status');
        });
    });

    // Test 2: Authentication Flow
    describe('Authentication System', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: `test${Date.now()}@pfms.gov.in`,
                    password: 'test123',
                    name: 'Test User',
                    role: 'officer'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
        });

        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'admin@pfms.gov.in',
                    password: 'admin123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'admin@pfms.gov.in',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    // Test 3: Alert Creation and Management
    describe('Alert Management Flow', () => {
        it('should create a new alert', async () => {
            const res = await request(app)
                .post('/alerts')
                .send({
                    amount: 5000000,
                    scheme: 'Civil Aviation Authority of Singapore',
                    vendor: 'Test Vendor',
                    beneficiary: 'Test Beneficiary'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('riskScore');
            testAlertId = res.body.id;
        });

        it('should fetch all alerts', async () => {
            const res = await request(app).get('/alerts');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should update alert status', async () => {
            const res = await request(app)
                .put(`/alerts/${testAlertId}/status`)
                .send({ status: 'Verified' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('Verified');
        });

        it('should get dashboard stats', async () => {
            const res = await request(app).get('/alerts/stats');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalAlerts');
        });
    });

    // Test 4: CRUD Operations
    describe('Scheme CRUD Operations', () => {
        let testSchemeId: string;

        it('should create a new scheme', async () => {
            testSchemeId = `SCH-TEST-${Date.now()}`;
            const res = await request(app)
                .post('/schemes')
                .send({
                    id: testSchemeId,
                    name: 'Test Scheme',
                    ministry: 'Test Ministry',
                    budgetAllocated: 1000000,
                    status: 'ACTIVE',
                    description: 'Test scheme for integration testing'
                });

            expect(res.status).toBe(201);
            expect(res.body.id).toBe(testSchemeId);
        });

        it('should fetch all schemes', async () => {
            const res = await request(app).get('/schemes');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should update a scheme', async () => {
            const res = await request(app)
                .put(`/schemes/${testSchemeId}`)
                .send({ budgetAllocated: 2000000 });

            expect(res.status).toBe(200);
            expect(res.body.budgetAllocated).toBe(2000000);
        });

        it('should delete a scheme', async () => {
            const res = await request(app).delete(`/schemes/${testSchemeId}`);
            expect(res.status).toBe(200);
        });
    });

    // Test 5: Network Visualization
    describe('Network Graph API', () => {
        it('should fetch vendor network data', async () => {
            const res = await request(app).get('/network/VEN-991');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('nodes');
            expect(res.body).toHaveProperty('edges');
            expect(Array.isArray(res.body.nodes)).toBe(true);
        });
    });
});
