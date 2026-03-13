import 'dotenv/config';
import mongoose from 'mongoose';
import { Admin } from './models/Admin.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pos_mobile';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const email = process.env.ADMIN_EMAIL || 'admin@pos.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
    return;
  }
  await Admin.create({ email, password });
  console.log('Admin created:', email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
