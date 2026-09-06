import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requestControls } from './middleware/requestControls';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import billingRoutes from './routes/billing.routes';
import invoiceRoutes from './routes/invoice.routes';
import grnRoutes from './routes/grn.routes';
import returnsRoutes from './routes/returns.routes';
import disposalRoutes from './routes/disposal.routes';
import patientRoutes from './routes/patient.routes';
import supplierRoutes from './routes/supplier.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';
import drugInteractionRoutes from './routes/drugInteraction.routes';

const app = express();
const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'] },
  transports: ['websocket'],
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6,
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
});

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(requestControls);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests. Please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/disposal', disposalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/drug-interactions', drugInteractionRoutes);

app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Genquantaa Pharmacy API is running 🚀', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  httpServer.listen(config.port, () => {
    console.log(`🏥 Genquantaa Pharmacy Backend listening on port ${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
  });
};

start().catch((err) => { console.error('Failed to start server:', err); process.exit(1); });
