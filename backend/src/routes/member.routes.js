import express from 'express';
import { getMembers, getMemberById, createMember, updateMember } from '../controllers/member.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', requireAdmin, createMember);
router.patch('/:id', updateMember);

export default router;
