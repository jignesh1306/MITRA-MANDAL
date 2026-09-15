import express from 'express';
import { getExpenses, createExpense } from '../controllers/expense.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getExpenses);
router.post('/', requireAdmin, createExpense);

export default router;
