// @ts-check
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('FATAL: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const passport = require('./config/passport');

const connectDB = require('./config/db');
const authRouter = require('./routes/authRoute.js');
const userRoute = require('./routes/userRoute.js');
const uploadRoute = require('./routes/uploadRoutes.js');
const requestRoute = require('./routes/requestRoute.js');
const jobRoute = require('./routes/jobRoute.js');
const digitalIdRoute = require('./routes/digitalIdRoute.js');
const auditRoute = require('./routes/auditRoute.js');
const notificationRoute = require('./routes/notificationRoute.js');
const householdRoute = require('./routes/householdRoute.js');
const reportRoute = require('./routes/reportRoute.js');
const { apiLimiter } = require('./middleware/rateLimiter');
const { createAuditLog } = require('./middleware/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const compression = require('compression');
app.use(compression());
app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  next();
});

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 60000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiLimiter);

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const autoAudit = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.user) {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const pathParts = req.baseUrl.split('/').filter(Boolean);
        const targetType = pathParts[pathParts.length - 1] || 'unknown';
        const actionMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
        createAuditLog({
          actorId: req.user.id,
          actorRole: req.user.role,
          action: `${actionMap[req.method]}_${targetType.toUpperCase()}`,
          targetType,
          targetId: req.params?.id,
          ipAddress: req.ip,
          details: `${req.method} ${req.originalUrl}`
        });
      }
      return originalJson(body);
    };
  }
  next();
};

app.use('/api/auth', authRouter);
app.use('/api/users', autoAudit, userRoute);
app.use('/api/uploads', autoAudit, uploadRoute);
app.use('/api/requests', autoAudit, requestRoute);
app.use('/api/jobs', autoAudit, jobRoute);
app.use('/api/digital-id', autoAudit, digitalIdRoute);
app.use('/api/audit', auditRoute);
app.use('/api/notifications', autoAudit, notificationRoute);
app.use('/api/households', autoAudit, householdRoute);
app.use('/api/reports', reportRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/', (req, res) => res.json({ message: 'RMS Kebele API is running', version: '1.0.0' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
});

/**
 * @typedef {Object} CustomError
 * @property {boolean} [isOperational]
 * @property {string} [errorType]
 * @property {string} message
 * @property {number} [statusCode]
 * @property {number} [status]
 * @property {string} [name]
 * @property {string} [stack]
 */

app.use((/** @type {CustomError} */ err, req, res, next) => {
  const logger = require('./config/logger');
  if (err.isOperational) {
    logger.warn(`${err.errorType}: ${err.message}`, { statusCode: err.statusCode, path: req.path });
  } else {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.errorType || err.name || 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
