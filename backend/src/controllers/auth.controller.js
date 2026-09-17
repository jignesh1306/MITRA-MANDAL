import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Group, generate6DigitCode } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';

const getAdminSecretCode = () => process.env.ADMIN_SECRET_CODE || '101005';

const generateTokens = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_mitra_mandal_key_2026_jwt_access', {
    expiresIn: '60d'
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'super_secret_mitra_mandal_key_2026_jwt_refresh', {
    expiresIn: '90d'
  });
  return { token, refreshToken };
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, adminSecretCode } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Full name, mobile number, and password are required.' });
    }

    const cleanPhone = String(phone).trim();
    const targetRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    // Check if account with same phone AND role already exists
    const existing = await User.findOne({ phone: cleanPhone, role: targetRole });
    if (existing) {
      return res.status(400).json({ 
        message: `An account with this mobile number already exists for ${targetRole === 'ADMIN' ? 'Admin' : 'User'} login.` 
      });
    }

    let group = await Group.findOne();
    if (!group) {
      group = await Group.create({
        name: 'Mitra-Mandal (મિત્ર-મંડળ)',
        monthlyContribution: 200000
      });
    }

    const isAdminSignup = targetRole === 'ADMIN';
    if (isAdminSignup) {
      const activeCode = getAdminSecretCode();
      if (!adminSecretCode || adminSecretCode.trim() !== activeCode) {
        return res.status(400).json({ message: `Invalid Admin Secret Code. Correct code is required to register as Admin.` });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Admin signup -> ACTIVE, Member signup -> PENDING (requires Admin approval)
    const userStatus = isAdminSignup ? 'ACTIVE' : 'PENDING';

    const user = await User.create({
      name,
      phone: cleanPhone,
      email: email || '',
      passwordHash,
      role: targetRole,
      status: userStatus
    });

    await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      status: userStatus
    });

    if (isAdminSignup) {
      const { token, refreshToken } = generateTokens(user._id);
      setTokenCookie(res, token);

      return res.status(201).json({
        message: 'Admin account created successfully.',
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status
        },
        token,
        refreshToken
      });
    } else {
      return res.status(201).json({
        isPending: true,
        message: 'Registration request submitted successfully! Please wait for Admin to approve your account before signing in.',
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password, role } = req.body;
    const cleanPhone = String(phone).trim();
    const targetRole = role ? (role === 'ADMIN' ? 'ADMIN' : 'MEMBER') : null;

    let user = null;
    if (targetRole) {
      user = await User.findOne({ phone: cleanPhone, role: targetRole });
    }
    if (!user) {
      user = await User.findOne({ phone: cleanPhone });
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid mobile number or password.' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ 
        message: 'Your registration request is pending Admin approval. Please contact the Admin to activate your account.' 
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ message: 'Your account has been disabled.' });
    }

    const { token, refreshToken } = generateTokens(user._id);
    setTokenCookie(res, token);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { phone, code, newPassword, role } = req.body;
    const cleanPhone = String(phone).trim();
    const targetRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    let user = await User.findOne({ phone: cleanPhone, role: targetRole });
    if (!user) {
      user = await User.findOne({ phone: cleanPhone });
    }
    if (!user) {
      return res.status(404).json({ message: 'No account found with this mobile number.' });
    }

    let group = await Group.findOne();
    if (!group) {
      return res.status(404).json({ message: 'Group configuration not found.' });
    }

    if (!code || code.trim() !== group.passwordResetCode) {
      return res.status(400).json({ 
        message: 'Invalid 6-digit Secret Code. Please obtain the active 6-digit code from Admin.' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Regenerate new one-time 6-digit code for Admin panel
    group.passwordResetCode = generate6DigitCode();
    await group.save();

    res.json({ 
      message: 'Password reset successfully! A new 6-digit secret code has been generated for Admin. You can now log in with your new password.' 
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};
