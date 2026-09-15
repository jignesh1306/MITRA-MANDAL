import express from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);

export default router;
