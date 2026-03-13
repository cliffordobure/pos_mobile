import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import adminAuthRoutes from './routes/adminAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pos_mobile';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

const adminDist = path.join(__dirname, '..', 'admin-web', 'dist');
app.use('/admin', express.static(adminDist, { index: false }));
app.get('/admin', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));

try {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
    autoSelectFamily: false,
  });
  console.log('MongoDB connected');
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  if (err.message.includes('whitelist') || err.message.includes('IP')) {
    console.error('→ Atlas: Network Access → Add IP → Allow access from anywhere (0.0.0.0/0)');
  }
  if (err.message.includes('SSL') || err.message.includes('TLS') || err.cause?.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') {
    console.error('→ If TLS error persists: Atlas Network Access must include 0.0.0.0/0; or try the Standard connection string (not SRV) from Atlas Connect.');
  }
  process.exit(1);
}

const host = '0.0.0.0';
app.listen(PORT, host, () => {
  console.log(`Server running on http://${host}:${PORT}`);
});
