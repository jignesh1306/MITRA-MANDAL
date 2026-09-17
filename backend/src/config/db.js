import mongoose from 'mongoose';
import { User } from '../models/User.js';

const syncUserIndexes = async () => {
  try {
    // Drop legacy strict unique indexes on email and phone if they exist
    await User.collection.dropIndex('email_1').catch(() => {});
    await User.collection.dropIndex('phone_1').catch(() => {});
    // Sync current schema indexes (compound phone + role index)
    await User.syncIndexes().catch(() => {});
    console.log('User indexes synced successfully.');
  } catch (err) {
    console.warn('User index sync warning:', err.message);
  }
};

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/mitra-mandal';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout before fallback
      });
      console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
      await syncUserIndexes();
      return;
    } catch (error) {
      console.warn(`[DB WARNING] Primary MongoDB connection failed (${error.message}). Falling back to local MongoDB...`);
    }
  }

  try {
    const localConn = await mongoose.connect(localUri);
    console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
    await syncUserIndexes();
  } catch (fallbackError) {
    console.error(`[DB ERROR] MongoDB connection error: ${fallbackError.message}`);
    process.exit(1);
  }
};
