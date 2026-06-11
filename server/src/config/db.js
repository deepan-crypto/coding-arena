const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDB() {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

module.exports = { connectDB };
