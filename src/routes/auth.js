import { Router } from 'express';
import { Shop } from '../models/Shop.js';
import { createToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await Shop.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const shop = await Shop.create({ name, email, password, plan: 'free', productLimit: 200 });
    const token = createToken(shop._id);
    res.status(201).json({
      token,
      shop: {
        id: shop._id,
        name: shop.name,
        email: shop.email,
        plan: shop.plan,
        productLimit: shop.productLimit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const shop = await Shop.findOne({ email }).select('+password');
    if (!shop || !(await shop.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = createToken(shop._id);
    res.json({
      token,
      shop: {
        id: shop._id,
        name: shop.name,
        email: shop.email,
        plan: shop.plan,
        productLimit: shop.productLimit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
