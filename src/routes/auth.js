import { Router } from 'express';
import { Shop } from '../models/Shop.js';
import { Owner } from '../models/Owner.js';
import { Staff } from '../models/Staff.js';
import { ShopOutlet } from '../models/ShopOutlet.js';
import { createToken } from '../middleware/auth.js';

const router = Router();

function shopPayload(shop) {
  return {
    id: shop._id,
    name: shop.name,
    email: shop.email,
    plan: shop.plan,
    productLimit: shop.productLimit,
  };
}

function outletPayload(outlet) {
  return { id: outlet._id, name: outlet.name };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;
    const firstShopName = shopName || name || 'My Shop';
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existingOwner = await Owner.findOne({ email });
    const existingStaff = await Staff.findOne({ email });
    const existingShop = await Shop.findOne({ email });
    if (existingOwner || existingStaff || existingShop) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const owner = await Owner.create({ name, email, password, plan: 'free', productLimit: 200 });
    const firstShop = await ShopOutlet.create({ name: firstShopName, ownerId: owner._id });
    const token = createToken({ id: owner._id, type: 'owner' });
    res.status(201).json({
      token,
      userType: 'owner',
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        plan: owner.plan,
        productLimit: owner.productLimit,
      },
      shops: [outletPayload(firstShop)],
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

    const owner = await Owner.findOne({ email }).select('+password');
    if (owner && (await owner.comparePassword(password))) {
      const shops = await ShopOutlet.find({ ownerId: owner._id }).select('name').lean();
      const token = createToken({ id: owner._id, type: 'owner' });
      return res.json({
        token,
        userType: 'owner',
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          plan: owner.plan,
          productLimit: owner.productLimit,
        },
        shops: shops.map((s) => ({ id: s._id, name: s.name })),
      });
    }

    const staff = await Staff.findOne({ email }).select('+password').populate('shopId');
    if (staff && staff.shopId && (await staff.comparePassword(password))) {
      const token = createToken({ id: staff._id, type: 'staff' });
      return res.json({
        token,
        userType: 'staff',
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          shopId: staff.shopId._id,
          shopName: staff.shopId.name,
        },
        shops: [{ id: staff.shopId._id, name: staff.shopId.name }],
      });
    }

    const shop = await Shop.findOne({ email }).select('+password');
    if (shop && (await shop.comparePassword(password))) {
      const token = createToken(shop._id);
      return res.json({
        token,
        userType: 'shop',
        shop: shopPayload(shop),
        shops: [{ id: shop._id, name: shop.name }],
      });
    }

    res.status(401).json({ error: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
