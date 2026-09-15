import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Please sign in to access this resource.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_mitra_mandal_key_2026_jwt_access');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({ message: 'Your account has been disabled.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};
