import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    productLimit: { type: Number, default: 200 },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

shopSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

shopSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const Shop = mongoose.model('Shop', shopSchema);
