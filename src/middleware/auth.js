import jwt from 'jsonwebtoken';
import { Shop } from '../models/Shop.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-mobile-secret-change-in-production';

export function authShop(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    Shop.findById(decoded.shopId)
      .then((shop) => {
        if (!shop) return res.status(401).json({ error: 'Shop not found' });
        req.shop = shop;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function createToken(shopId) {
  return jwt.sign({ shopId }, JWT_SECRET, { expiresIn: '30d' });
}
