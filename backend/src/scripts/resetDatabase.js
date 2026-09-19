import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from src)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mitra-mandal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`Connected successfully to: ${mongoose.connection.host} / Database: ${mongoose.connection.name}`);

    const collections = await mongoose.connection.db.collections();
    console.log(`Found ${collections.length} collections.`);

    for (const collection of collections) {
      const count = await collection.countDocuments();
      await collection.deleteMany({});
      console.log(`Cleared collection: ${collection.collectionName} (deleted ${count} documents)`);
    }

    console.log('\nAll data has been completely removed! Both User and Admin data are cleared.');
    console.log('You can now register a fresh Admin and start from the very beginning.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
};

resetDatabase();
