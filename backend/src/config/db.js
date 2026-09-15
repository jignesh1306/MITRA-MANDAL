import mongoose from 'mongoose';

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/mitra-mandal';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout before fallback
      });
      console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`[DB WARNING] Primary MongoDB connection failed (${error.message}). Falling back to local MongoDB...`);
    }
  }

  try {
    const localConn = await mongoose.connect(localUri);
    console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
  } catch (fallbackError) {
    console.error(`[DB ERROR] MongoDB connection error: ${fallbackError.message}`);
    process.exit(1);
  }
};
