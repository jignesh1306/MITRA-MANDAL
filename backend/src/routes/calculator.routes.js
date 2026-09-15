import express from 'express';
import { calculateEMI } from '../controllers/calculator.controller.js';

const router = express.Router();

// Public route for public EMI calculator
router.post('/loan', calculateEMI);

export default router;
