import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopOutlet', required: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, default: null },
    sellingPrice: { type: Number, required: true, min: 0 },
    buyingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ shopId: 1 });
productSchema.index({ shopId: 1, barcode: 1 }, { sparse: true });

export const Product = mongoose.model('Product', productSchema);
