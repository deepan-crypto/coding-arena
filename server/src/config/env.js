const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../.env.example')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const mongoUri = process.env.MONGO_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/coding_assessment');
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-me');

if (!process.env.MONGO_URI && process.env.NODE_ENV !== 'test') {
  console.warn('Missing environment variable: MONGO_URI');
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('Missing environment variable: JWT_SECRET');
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiHost: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@platform.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345'
};
