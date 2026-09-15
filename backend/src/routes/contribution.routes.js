import express from 'express';
import { 
  getContributions, 
  getMyContributions, 
  generateContributions, 
  markPaid, 
  markAllPaid 
} from '../controllers/contribution.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireAdmin, getContributions);
router.get('/my', getMyContributions);
router.post('/generate', requireAdmin, generateContributions);
router.post('/:id/mark-paid', requireAdmin, markPaid);
router.post('/mark-all-paid', requireAdmin, markAllPaid);

export default router;
