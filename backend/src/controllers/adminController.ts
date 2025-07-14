import { Request, Response } from 'express';
import { User } from '../models/User';
import { DealModel } from '../models/Deal';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';

class AdminController {
  // Get all users with statistics
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      // Get deal counts for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const totalDeals = await DealModel.countDocuments({ userId: user._id });
          
          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            totalDeals,
          };
        })
      );

      logger.info(`[ADMIN] User list requested by ${req.user?.email}`, {
        adminId: req.user?.id,
        totalUsers: usersWithStats.length,
      });

      res.json({
        message: 'Users retrieved successfully',
        users: usersWithStats,
        total: usersWithStats.length,
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        details: error.message,
      });
    }
  }

  // Get specific user by ID
  async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const totalDeals = await DealModel.countDocuments({ userId: user._id });

      const userWithStats = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        totalDeals,
      };

      logger.info(`[ADMIN] User details requested by ${req.user?.email}`, {
        adminId: req.user?.id,
        targetUserId: userId,
      });

      res.json({
        message: 'User retrieved successfully',
        user: userWithStats,
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error fetching user:', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        details: error.message,
      });
    }
  }

  // Update user role
  async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be "user" or "admin"',
        });
      }

      // Prevent self-role modification
      if (userId === req.user?.id) {
        return res.status(400).json({
          error: 'Cannot modify your own role',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      logger.info(`[ADMIN] User role updated by ${req.user?.email}`, {
        adminId: req.user?.id,
        targetUserId: userId,
        targetUserEmail: user.email,
        oldRole,
        newRole: role,
      });

      res.json({
        message: 'User role updated successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error updating user role:', error);
      res.status(500).json({
        error: 'Failed to update user role',
        details: error.message,
      });
    }
  }

  // Update user verification status
  async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid status. Must be boolean',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const oldStatus = user.isVerified;
      user.isVerified = isVerified;
      await user.save();

      logger.info(`[ADMIN] User status updated by ${req.user?.email}`, {
        adminId: req.user?.id,
        targetUserId: userId,
        targetUserEmail: user.email,
        oldStatus,
        newStatus: isVerified,
      });

      res.json({
        message: 'User status updated successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          isVerified: user.isVerified,
        },
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error updating user status:', error);
      res.status(500).json({
        error: 'Failed to update user status',
        details: error.message,
      });
    }
  }

  // Delete user (soft delete for now)
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Prevent self-deletion
      if (userId === req.user?.id) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // TODO: Implement soft delete or data archival
      // For now, just return not implemented
      res.status(501).json({
        error: 'User deletion not implemented yet',
        message: 'This feature will be available in a future update',
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error deleting user:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        details: error.message,
      });
    }
  }

  // Get system statistics
  async getSystemStats(req: AuthenticatedRequest, res: Response) {
    try {
      const [
        totalUsers,
        totalAdmins,
        verifiedUsers,
        totalDeals,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isVerified: true }),
        DealModel.countDocuments({}),
        User.countDocuments({ 
          createdAt: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          } 
        }),
      ]);

      logger.info(`[ADMIN] System stats requested by ${req.user?.email}`, {
        adminId: req.user?.id,
      });

      res.json({
        message: 'System statistics retrieved successfully',
        stats: {
          users: {
            total: totalUsers,
            admins: totalAdmins,
            verified: verifiedUsers,
            recent: recentUsers,
          },
          deals: {
            total: totalDeals,
          },
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error: any) {
      logger.error('[ADMIN] Error fetching system stats:', error);
      res.status(500).json({
        error: 'Failed to fetch system statistics',
        details: error.message,
      });
    }
  }
}

export const adminController = new AdminController();