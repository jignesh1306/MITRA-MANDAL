import express from 'express';
import {
  getLoans,
  getMyLoans,
  getLoanRequests,
  getLoanById,
  requestLoan,
  approveRequest,
  rejectRequest,
  recordEMIPayment
} from '../controllers/loan.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireAdmin, getLoans);
router.get('/my', getMyLoans);
router.get('/requests', requireAdmin, getLoanRequests);
router.get('/:id', getLoanById);

router.post('/request', requestLoan);
router.post('/requests/:id/approve', requireAdmin, approveRequest);
router.post('/requests/:id/reject', requireAdmin, rejectRequest);
router.post('/installments/:id/pay', requireAdmin, recordEMIPayment);

export default router;
