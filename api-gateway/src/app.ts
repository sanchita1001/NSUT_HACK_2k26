import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import alertRoutes from './routes/alert.routes';
import networkRoutes from './routes/network.routes';
import resourceRoutes from './routes/resource.routes';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';
import { Scheme, Vendor, AuditLog } from './models'; // Keep legacy simple routes for now

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/alerts', alertRoutes);
app.use('/network', networkRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/', resourceRoutes);


export default app;
