import express from 'express';
import { registerUser, loginUser, getSessions, revokeSession, logoutUser } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/sessions', authMiddleware, getSessions);
router.post('/sessions/revoke', authMiddleware, revokeSession);
router.post('/logout', authMiddleware, logoutUser);

export default router;
