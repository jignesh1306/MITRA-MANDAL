import express from 'express';
import multer from 'multer';
import { 
  createSubmission, 
  getSubmissions, 
  approveSubmission, 
  rejectSubmission 
} from '../controllers/emiSubmission.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.use(protect);

router.route('/')
  .post(upload.single('proofImage'), createSubmission)
  .get(getSubmissions);

router.patch('/:id/approve', requireAdmin, approveSubmission);
router.patch('/:id/reject', requireAdmin, rejectSubmission);

export default router;
