import jwt from 'jsonwebtoken';
import { Shop } from '../models/Shop.js';
import { Owner } from '../models/Owner.js';
import { Staff } from '../models/Staff.js';
import { ShopOutlet } from '../models/ShopOutlet.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-mobile-secret-change-in-production';

export function createToken(payload) {
  if (payload == null || typeof payload === 'string' || (typeof payload === 'object' && payload.type == null && (payload.id != null || payload.sub != null))) {
    const sub = payload?.id ?? payload?.sub ?? payload;
    return jwt.sign({ sub, type: 'shop' }, JWT_SECRET, { expiresIn: '30d' });
  }
  const { id, type } = payload;
  return jwt.sign({ sub: id, type: type || 'shop' }, JWT_SECRET, { expiresIn: '30d' });
}

async function loadLegacyShop(shopId) {
  const shop = await Shop.findById(shopId);
  if (!shop) return null;
  return { type: 'shop', shop, shops: [{ id: shop._id, name: shop.name }], owner: null, staff: null };
}

async function loadOwner(ownerId) {
  const owner = await Owner.findById(ownerId);
  if (!owner) return null;
  const shops = await ShopOutlet.find({ ownerId }).select('name').lean();
  return {
    type: 'owner',
    owner,
    shops: shops.map((s) => ({ id: s._id, name: s.name })),
    shop: null,
    staff: null,
  };
}

async function loadStaff(staffId) {
  const staff = await Staff.findById(staffId).populate('shopId');
  if (!staff || !staff.shopId) return null;
  return {
    type: 'staff',
    staff,
    shop: staff.shopId,
    shops: [{ id: staff.shopId._id, name: staff.shopId.name }],
    owner: null,
  };
}

export function authShop(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const type = decoded.type || 'shop';
    const id = decoded.sub;

    if (type === 'owner') {
      loadOwner(id)
        .then((auth) => {
          if (!auth) return res.status(401).json({ error: 'Account not found' });
          req.auth = auth;
          req.shop = null;
          req.owner = auth.owner;
          req.staff = null;
          req.shops = auth.shops;
          next();
        })
        .catch(() => res.status(401).json({ error: 'Invalid token' }));
      return;
    }
    if (type === 'staff') {
      loadStaff(id)
        .then((auth) => {
          if (!auth) return res.status(401).json({ error: 'Account not found' });
          req.auth = auth;
          req.shop = auth.shop;
          req.owner = null;
          req.staff = auth.staff;
          req.shops = auth.shops;
          next();
        })
        .catch(() => res.status(401).json({ error: 'Invalid token' }));
      return;
    }
    loadLegacyShop(id)
      .then((auth) => {
        if (!auth) return res.status(401).json({ error: 'Shop not found' });
        req.auth = auth;
        req.shop = auth.shop;
        req.owner = null;
        req.staff = null;
        req.shops = auth.shops;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireOwner(req, res, next) {
  if (req.auth?.type !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

export function requireStaffOrOwner(req, res, next) {
  if (req.auth?.type !== 'owner' && req.auth?.type !== 'staff') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}
