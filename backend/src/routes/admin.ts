import express from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication and admin role requirement to all admin routes
router.use(authMiddleware);
router.use(requireRole('admin'));

// User management routes
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.get('/users/:userId', adminController.getUserById);
router.delete('/users/:userId', adminController.deleteUser);

// System statistics routes (for future)
router.get('/stats', adminController.getSystemStats);

export default router;