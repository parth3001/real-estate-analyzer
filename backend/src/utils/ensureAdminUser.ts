import { User } from '../models/User';
import { logger } from './logger';
import bcrypt from 'bcryptjs';

export async function ensureAdminUser(): Promise<void> {
  try {
    const adminEmail = process.env.SMOKE_TEST_EMAIL || 'admin@realestateanalyzer.com';
    const adminPassword = process.env.SMOKE_TEST_PASSWORD || 'Spring@2025';
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      logger.info(`✅ Admin user already exists: ${adminEmail}`);
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true
    });
    
    await adminUser.save();
    logger.info(`✅ Created admin user: ${adminEmail}`);
    
  } catch (error) {
    logger.error('Error ensuring admin user exists:', error);
    // Don't throw - allow server to continue starting
  }
}