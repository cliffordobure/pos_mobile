import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { authShop, requireStaffOrOwner } from '../middleware/auth.js';

const router = Router();

router.use(authShop);
router.use(requireStaffOrOwner);

router.get('/products', async (req, res) => {
  try {
    const shopId = req.staff ? req.staff.shopId._id : req.query.shopId;
    if (!shopId) {
      return res.status(400).json({ error: 'shopId required' });
    }
    if (req.auth.type === 'staff' && String(req.staff.shopId._id) !== String(shopId)) {
      return res.status(403).json({ error: 'Access denied to this shop' });
    }
    const products = await Product.find({ shopId }).sort({ name: 1 }).lean();
    res.json(products.map((p) => ({
      id: p._id,
      name: p.name,
      barcode: p.barcode,
      sellingPrice: p.sellingPrice,
      buyingPrice: p.buyingPrice,
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const { shopId, totalAmount, totalCost, items } = req.body;
    if (!shopId || totalAmount == null || totalCost == null || !Array.isArray(items)) {
      return res.status(400).json({ error: 'shopId, totalAmount, totalCost and items required' });
    }
    const staffId = req.auth.type === 'staff' ? req.staff._id : null;
    if (req.auth.type === 'staff' && String(req.staff.shopId._id) !== String(shopId)) {
      return res.status(403).json({ error: 'Access denied to this shop' });
    }
    const sale = await Sale.create({
      shopId,
      staffId: staffId || undefined,
      totalAmount: Number(totalAmount),
      totalCost: Number(totalCost),
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName ?? '',
        barcode: i.barcode ?? null,
        unitPrice: Number(i.unitPrice) ?? 0,
        quantity: Number(i.quantity) ?? 0,
        total: Number(i.total) ?? 0,
      })),
    });
    for (const item of items) {
      if (item.productId && item.quantity > 0) {
        await Product.findOneAndUpdate(
          { _id: item.productId, shopId },
          { $inc: { quantity: -Number(item.quantity) } }
        );
      }
    }
    res.status(201).json({ id: sale._id, createdAt: sale.createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
