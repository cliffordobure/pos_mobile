import { Router } from 'express';
import { ShopOutlet } from '../models/ShopOutlet.js';
import { Staff } from '../models/Staff.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { authShop, requireOwner } from '../middleware/auth.js';

const router = Router();

router.use(authShop);
router.use(requireOwner);

router.post('/shops', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Shop name required' });
    }
    const shop = await ShopOutlet.create({
      name: name.trim(),
      ownerId: req.owner._id,
    });
    res.status(201).json({ id: shop._id, name: shop.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shops', async (req, res) => {
  try {
    const shops = await ShopOutlet.find({ ownerId: req.owner._id })
      .select('name')
      .lean();
    res.json(shops.map((s) => ({ id: s._id, name: s.name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shops/:shopId/staff', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const existing = await Staff.findOne({ email: email.toLowerCase().trim(), shopId });
    if (existing) return res.status(400).json({ error: 'A staff with this email already exists in this shop' });
    const staff = await Staff.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      shopId,
    });
    res.status(201).json({
      id: staff._id,
      name: staff.name,
      email: staff.email,
      shopId: shop._id,
      shopName: shop.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shops/:shopId/staff', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const list = await Staff.find({ shopId }).select('name email').lean();
    res.json(list.map((s) => ({ id: s._id, name: s.name, email: s.email })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shops/:shopId/products', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const products = await Product.find({ shopId }).sort({ name: 1 }).lean();
    res.json(products.map((p) => ({
      id: p._id,
      name: p.name,
      barcode: p.barcode,
      sellingPrice: p.sellingPrice,
      buyingPrice: p.buyingPrice,
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shops/:shopId/products', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, barcode, sellingPrice, buyingPrice, quantity, lowStockThreshold } = req.body;
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const limit = req.owner.productLimit ?? 200;
    const count = await Product.countDocuments({ shopId });
    if (count >= limit) {
      return res.status(403).json({ error: `Product limit (${limit}) reached for this plan` });
    }
    const product = await Product.create({
      shopId,
      name: name?.trim() ?? '',
      barcode: barcode?.trim() || null,
      sellingPrice: Number(sellingPrice) ?? 0,
      buyingPrice: Number(buyingPrice) ?? 0,
      quantity: Number(quantity) ?? 0,
      lowStockThreshold: Number(lowStockThreshold) ?? 5,
    });
    res.status(201).json({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
      sellingPrice: product.sellingPrice,
      buyingPrice: product.buyingPrice,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/shops/:shopId/products/:productId', async (req, res) => {
  try {
    const { shopId, productId } = req.params;
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const updates = {};
    if (req.body.name != null) updates.name = String(req.body.name).trim();
    if (req.body.barcode != null) updates.barcode = req.body.barcode ? String(req.body.barcode).trim() : null;
    if (req.body.sellingPrice != null) updates.sellingPrice = Number(req.body.sellingPrice);
    if (req.body.buyingPrice != null) updates.buyingPrice = Number(req.body.buyingPrice);
    if (req.body.quantity != null) updates.quantity = Math.max(0, Number(req.body.quantity));
    if (req.body.lowStockThreshold != null) updates.lowStockThreshold = Number(req.body.lowStockThreshold);
    const product = await Product.findOneAndUpdate(
      { _id: productId, shopId },
      { $set: updates, $currentDate: { updatedAt: true } },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
      sellingPrice: product.sellingPrice,
      buyingPrice: product.buyingPrice,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      updatedAt: product.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shops/:shopId/sales', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await ShopOutlet.findOne({ _id: shopId, ownerId: req.owner._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const sales = await Sale.find({ shopId })
      .populate('staffId', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json(sales.map((s) => ({
      id: s._id,
      totalAmount: s.totalAmount,
      totalCost: s.totalCost,
      staffId: s.staffId?._id,
      staffName: s.staffId?.name,
      createdAt: s.createdAt,
      items: s.items || [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const shopIds = (await ShopOutlet.find({ ownerId: req.owner._id }).select('_id').lean()).map((s) => s._id);
    const [productCount, salesCount, todaySales] = await Promise.all([
      Product.countDocuments({ shopId: { $in: shopIds } }),
      Sale.countDocuments({ shopId: { $in: shopIds } }),
      Sale.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    res.json({
      productCount,
      salesCount,
      todaySales: todaySales[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
