import express from 'express';
import { registerUser, loginUser, getSessions, revokeSession, logoutUser, googleAuth } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);

router.get('/sessions', authMiddleware, getSessions);
router.post('/sessions/revoke', authMiddleware, revokeSession);
router.post('/logout', authMiddleware, logoutUser);

export default router;
