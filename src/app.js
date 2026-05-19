import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'dotenv/config';
import { apiLimiter } from './middleware/rate_limit.js';

import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(apiLimiter);
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = 3000 ;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});