import express from 'express';
import { registerUser, loginUser, getSessions, revokeSession, logoutUser, googleAuth, updateProfile, changePassword, generate2FA, enable2FA, verifyLogin2FA } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);

router.get('/sessions', authMiddleware, getSessions);
router.post('/sessions/revoke', authMiddleware, revokeSession);
router.post('/logout', authMiddleware, logoutUser);

router.put('/updateProfile', authMiddleware, updateProfile);
router.put('/changePassword', authMiddleware, changePassword);

// 2FA Routes
router.get('/2fa/generate', authMiddleware, generate2FA);
router.post('/2fa/enable', authMiddleware, enable2FA);
router.post('/2fa/verify-login', verifyLogin2FA);

export default router;
