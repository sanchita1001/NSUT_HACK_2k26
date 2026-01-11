import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import alertRoutes from './routes/alert.routes';
import networkRoutes from './routes/network.routes';
import resourceRoutes from './routes/resource.routes';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';
import summaryRoutes from './routes/summary.routes';
import simulatorRoutes from './routes/simulator.routes';
import mapRoutes from './routes/map.routes';
import { Scheme, Vendor, AuditLog } from './models';
import { auditMiddleware } from './services/audit.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Audit logging middleware (after body parser)
app.use(auditMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/alerts', alertRoutes);
app.use('/network', networkRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/summary', summaryRoutes);
app.use('/simulator', simulatorRoutes);
app.use('/map', mapRoutes);
app.use('/', resourceRoutes);


export default app;
