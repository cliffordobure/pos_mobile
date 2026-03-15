import mongoose from 'mongoose';

const shopOutletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  },
  { timestamps: true }
);

shopOutletSchema.index({ ownerId: 1 });

export const ShopOutlet = mongoose.model('ShopOutlet', shopOutletSchema);
