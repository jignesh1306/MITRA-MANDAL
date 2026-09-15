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

router.use(authenticateUser, requireAdmin);

router.get('/fund', generateFundReport);
router.get('/contributions', generateContributionReport);
router.get('/loans', generateLoanReport);
router.get('/expenses', generateExpenseReport);

export default router;
