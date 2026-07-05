const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/missiongrid';
const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

const isProduction = process.env.NODE_ENV === 'production';

const connectWithUri = async (mongoUri, label) => {
  const conn = await mongoose.connect(mongoUri, CONNECT_OPTIONS);
  console.log(`MongoDB connected (${label}): ${conn.connection.host}`);
  return conn;
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  const localUri = process.env.LOCAL_MONGO_URI || DEFAULT_MONGO_URI;

  try {
    return await connectWithUri(primaryUri, process.env.MONGO_URI ? 'configured URI' : 'local default');
  } catch (error) {
    const canUseLocalFallback =
      !isProduction &&
      process.env.DISABLE_LOCAL_DB_FALLBACK !== 'true' &&
      primaryUri !== localUri;

    if (!canUseLocalFallback) {
      console.error(`MongoDB connection error: ${error.message}`);
      throw error;
    }

    console.warn(`Configured MongoDB URI failed: ${error.message}`);
    console.warn(`Falling back to local MongoDB: ${localUri}`);

    try {
      await mongoose.disconnect();
      return await connectWithUri(localUri, 'local fallback');
    } catch (fallbackError) {
      console.error(`Local MongoDB fallback failed: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

module.exports = connectDB;
