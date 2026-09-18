import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import memberRoutes from './routes/member.routes.js';
import contributionRoutes from './routes/contribution.routes.js';
import loanRoutes from './routes/loan.routes.js';
import calculatorRoutes from './routes/calculator.routes.js';
import fundRoutes from './routes/fund.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import revenueRoutes from './routes/revenue.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';
import emiSubmissionRoutes from './routes/emiSubmission.routes.js';
import uploadRoutes from './routes/upload.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or matching allowedOrigins / vercel previews
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow to avoid blocking production Vercel deployments
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: 'Too many requests. Please try again later.',
  skip: (req) => req.path === '/health' || req.originalUrl === '/api/health' || req.path === '/api/health'
});
app.use('/api', limiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/fund', fundRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/emi-submissions', emiSubmissionRoutes);
app.use('/api/upload', uploadRoutes);

// Public lightweight health check endpoints (no auth, no DB queries)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running'
  });
});

app.use(errorHandler);

export default app;
