import express from 'express';
import { 
  getNotifications, 
  markRead, 
  getVapidKey, 
  subscribePush, 
  unsubscribePush 
} from '../controllers/notification.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);

router.get('/vapid-public-key', getVapidKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

export default router;
