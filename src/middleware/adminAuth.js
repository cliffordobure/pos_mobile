import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-mobile-secret-change-in-production';
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'pos-admin-secret';

export function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    Admin.findById(decoded.adminId)
      .then((admin) => {
        if (!admin) return res.status(401).json({ error: 'Admin not found' });
        req.admin = admin;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function createAdminToken(adminId) {
  return jwt.sign({ adminId, role: 'admin' }, ADMIN_SECRET, { expiresIn: '7d' });
}
