import { Router } from 'express';
import { SyncData } from '../models/SyncData.js';
import { authShop } from '../middleware/auth.js';

const router = Router();

router.use(authShop);

router.post('/push', async (req, res) => {
  try {
    const shop = req.shop;
    if (shop.plan !== 'paid') {
      return res.status(403).json({ error: 'Cloud backup is a paid feature. Upgrade to sync data.' });
    }
    const { products = [], sales = [], saleItems = [] } = req.body;
    await SyncData.findOneAndUpdate(
      { shopId: shop._id },
      { products, sales, saleItems, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true, message: 'Data synced' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pull', async (req, res) => {
  try {
    const shop = req.shop;
    if (shop.plan !== 'paid') {
      return res.json({ products: [], sales: [], saleItems: [] });
    }
    const data = await SyncData.findOne({ shopId: shop._id });
    res.json({
      products: data?.products ?? [],
      sales: data?.sales ?? [],
      saleItems: data?.saleItems ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
