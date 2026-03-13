import { Router } from 'express';
import { Shop } from '../models/Shop.js';
import { Subscription } from '../models/Subscription.js';
import { authAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [totalShops, freeCount, paidCount, revenueResult] = await Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ plan: 'free' }),
      Shop.countDocuments({ plan: 'paid' }),
      Subscription.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const totalRevenue = revenueResult[0]?.total ?? 0;
    res.json({
      totalMembers: totalShops,
      freePlan: freeCount,
      paidPlan: paidCount,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shops', async (req, res) => {
  try {
    const shops = await Shop.find()
      .select('name email plan productLimit createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subscriptions', async (req, res) => {
  try {
    const { shopId, amount, period = 'monthly' } = req.body;
    if (!shopId || amount == null) {
      return res.status(400).json({ error: 'shopId and amount required' });
    }
    const sub = await Subscription.create({ shopId, amount, period });
    await Shop.findByIdAndUpdate(shopId, { plan: 'paid', productLimit: 999999 });
    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
