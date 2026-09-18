import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = express.Router();

router.use(authenticateUser);
router.use(requireAdmin);

// Generic image upload endpoint for admins (loan proof screenshots etc.)
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: 'mitra_mandal_proofs',
      resource_type: 'image'
    });

    res.json({
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id
    });
  } catch (error) {
    next(error);
  }
});

export default router;
