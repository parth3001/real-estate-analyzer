import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    try {
      logger.info(`[UserRepository] Finding user by ID: ${id}`);
      return await User.findById(id).select('-password');
    } catch (error) {
      logger.error('[UserRepository] Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    try {
      logger.info(`[UserRepository] Finding user by email: ${email}`);
      return await User.findOne({ email }).select('-password');
    } catch (error) {
      logger.error('[UserRepository] Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    try {
      logger.info(`[UserRepository] Finding user by email with password: ${email}`);
      return await User.findOne({ email }).select('+password');
    } catch (error) {
      logger.error('[UserRepository] Error finding user by email with password:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      logger.info(`[UserRepository] Creating new user: ${userData.email}`);
      const user = new User(userData);
      const savedUser = await user.save();
      
      // Return user without password
      return await this.findById(savedUser.id) as IUser;
    } catch (error) {
      logger.error('[UserRepository] Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  async updateById(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    try {
      logger.info(`[UserRepository] Updating user: ${id}`);
      const user = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      logger.error('[UserRepository] Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      logger.info(`[UserRepository] Deleting user: ${id}`);
      const result = await User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('[UserRepository] Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Find all users (admin functionality)
   */
  async findAll(limit?: number, skip?: number): Promise<IUser[]> {
    try {
      logger.info(`[UserRepository] Finding all users (limit: ${limit}, skip: ${skip})`);
      
      let query = User.find().select('-password').sort({ createdAt: -1 });
      
      if (skip) {
        query = query.skip(skip);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      logger.error('[UserRepository] Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    try {
      logger.info('[UserRepository] Counting total users');
      return await User.countDocuments();
    } catch (error) {
      logger.error('[UserRepository] Error counting users:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      logger.info(`[UserRepository] Updating last login for user: ${id}`);
      await User.findByIdAndUpdate(id, { lastLogin: new Date() });
    } catch (error) {
      logger.error('[UserRepository] Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<IUser[]> {
    try {
      logger.info(`[UserRepository] Finding users by role: ${role}`);
      return await User.find({ role }).select('-password').sort({ createdAt: -1 });
    } catch (error) {
      logger.error('[UserRepository] Error finding users by role:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      logger.info(`[UserRepository] Checking if email exists: ${email}`);
      
      const query: any = { email };
      if (excludeUserId) {
        query._id = { $ne: excludeUserId };
      }
      
      const user = await User.findOne(query);
      return !!user;
    } catch (error) {
      logger.error('[UserRepository] Error checking email existence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();