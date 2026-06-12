const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { clientOrigin } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const compilerRoutes = require('./routes/compilerRoutes');

const app = express();

// Trust the Nginx reverse proxy (required for express-rate-limit behind a proxy)
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 1000 // Increased from 120 for higher concurrency
  })
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'coding-assessment-platform-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/compiler', compilerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
