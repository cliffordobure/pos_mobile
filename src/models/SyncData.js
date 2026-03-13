import mongoose from 'mongoose';

const syncDataSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true },
    products: { type: mongoose.Schema.Types.Mixed, default: [] },
    sales: { type: mongoose.Schema.Types.Mixed, default: [] },
    saleItems: { type: mongoose.Schema.Types.Mixed, default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SyncData = mongoose.model('SyncData', syncDataSchema);
