import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    barcode: { type: String, default: null },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: true }
);

const saleSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopOutlet', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    totalAmount: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    items: [saleItemSchema],
  },
  { timestamps: true }
);

saleSchema.index({ shopId: 1, createdAt: -1 });
saleSchema.index({ staffId: 1, createdAt: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
