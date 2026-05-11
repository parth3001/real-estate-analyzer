import mongoose from 'mongoose';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function resetAdminPassword() {
  // Require env vars — no hardcoded fallback for password (security)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer';
  const adminEmail = process.env.SMOKE_TEST_EMAIL;
  const newPassword = process.env.SMOKE_TEST_PASSWORD;

  if (!adminEmail || !newPassword) {
    logger.error('❌ SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD env vars are required.');
    logger.error('   Usage: SMOKE_TEST_EMAIL=admin@example.com SMOKE_TEST_PASSWORD=<strong-pwd> npm run script:reset-admin');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    const adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      logger.info(`Admin user not found; creating: ${adminEmail}`);

      const newAdmin = new User({
        email: adminEmail,
        password: newPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true
      });

      await newAdmin.save();
      logger.info(`Created admin user: ${adminEmail}`);
    } else {
      adminUser.password = newPassword;
      await adminUser.save();
      logger.info(`Updated admin password for: ${adminEmail}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
