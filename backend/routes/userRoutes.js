import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  register,
  createProfile,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadVerification,
} from '../controllers/userController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/verification');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, unique + ext);
  },
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/profile');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, unique + ext);
  },
});

const uploadVerificationMulter = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|pdf)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only jpg, jpeg, png, pdf allowed.'));
  },
});

const uploadProfileMulter = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only image files allowed.'));
  },
});

const router = express.Router();

router.post('/register', register);
router.post('/create-profile', createProfile);
router.get('/profile/:userId?', getProfile);
router.put('/update-profile', updateProfile);
router.put('/profile/:userId', updateProfile);
router.post('/upload-profile-picture', uploadProfileMulter.single('photo'), uploadProfilePicture);
router.post('/upload-verification', uploadVerificationMulter.single('document'), uploadVerification);

export default router;
