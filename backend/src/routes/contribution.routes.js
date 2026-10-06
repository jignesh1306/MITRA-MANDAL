import express from 'express';
import {
  getContributions,
  getMyContributions,
  generateContributions,
  markPaid,
  markAllPaid,
  getMemberEntries,
  deleteContribution,
  deleteLoanInstallment,
} from '../controllers/contribution.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireAdmin, getContributions);
router.get('/my', getMyContributions);
router.post('/generate', requireAdmin, generateContributions);
router.post('/mark-all-paid', requireAdmin, markAllPaid);

// Member-level entries: regular EMI + loan installments for a given month
router.get('/member/:memberId', requireAdmin, getMemberEntries);

// Regular EMI mark-paid (uses contribution.service.js — atomic, duplicate-safe)
router.post('/:id/mark-paid', requireAdmin, markPaid);

// Permanent deletes (also cleans up linked transactions)
router.delete('/:id', requireAdmin, deleteContribution);
router.delete('/installment/:id', requireAdmin, deleteLoanInstallment);

// NOTE: Loan installment mark-paid is handled by /api/loans/installments/:id/pay
// which uses the full payInstallment() service (creates principal+interest transactions atomically)

export default router;
