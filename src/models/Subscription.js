import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
