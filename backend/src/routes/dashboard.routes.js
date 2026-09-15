import express from 'express';
import { getAdminSummary, getMemberSummary } from '../controllers/dashboard.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/admin-summary', requireAdmin, getAdminSummary);
router.get('/member-summary', getMemberSummary);

export default router;
