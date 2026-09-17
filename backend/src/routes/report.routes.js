import express from 'express';
import { 
  generateFundReport, 
  generateContributionReport, 
  generateLoanReport, 
  generateExpenseReport 
} from '../controllers/report.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

// Group Fund Report is visible to all authenticated users (Members and Admins)
router.get('/fund', generateFundReport);

// Detailed admin reports
router.get('/contributions', requireAdmin, generateContributionReport);
router.get('/loans', requireAdmin, generateLoanReport);
router.get('/expenses', requireAdmin, generateExpenseReport);

export default router;
