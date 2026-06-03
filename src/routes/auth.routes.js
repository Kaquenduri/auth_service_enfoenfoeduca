import { Router } from 'express';

import {
  register,
  login,
  me,
  getUserById,
  googleLogin
} from '../controllers/auth.controller.js';

import { validate } from '../middleware/validate.js';
import { registerSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/authLimiter.js';
import { verifyToken } from '../middleware/auth.middleware.js';


const router = Router();

router.post('/register',validate(registerSchema), register);
router.post('/login', authLimiter, login);
router.get('/me', verifyToken, me);
router.get('/users/:id', getUserById);
router.post('/google-login', googleLogin);

export default router;
