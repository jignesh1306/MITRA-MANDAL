import express from 'express';
import { getSettings, updateSettings, getPublicStats } from '../controllers/settings.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

// Public route for fetching settings (interest rates, group info)
router.get('/', getSettings);
router.get('/public-stats', getPublicStats);

// Admin-only route for updating settings
router.patch('/', authenticateUser, requireAdmin, updateSettings);

export default router;
