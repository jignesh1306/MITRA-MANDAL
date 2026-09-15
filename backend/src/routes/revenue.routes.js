import express from 'express';
import { getRevenues, createRevenue } from '../controllers/revenue.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getRevenues);
router.post('/', requireAdmin, createRevenue);

export default router;
