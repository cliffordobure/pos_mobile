import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopOutlet', required: true },
  },
  { timestamps: true }
);

staffSchema.index({ shopId: 1 });
staffSchema.index({ email: 1, shopId: 1 }, { unique: true });

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

staffSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const Staff = mongoose.model('Staff', staffSchema);
