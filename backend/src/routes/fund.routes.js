import express from 'express';
import { getFundDetails, getTransactions } from '../controllers/fund.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/summary', getFundDetails);
router.get('/transactions', getTransactions);

export default router;
