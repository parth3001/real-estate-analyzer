import request from 'supertest';
import express, { Express } from 'express';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { mockUser } from '../fixtures/testData';
import { User } from '../../models/User';
import bcrypt from 'bcryptjs';

// Import your express app setup
let app: Express;

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
    
    // Create minimal express app for testing
    app = express();
    app.use(express.json());
    
    // Import and use auth routes
    const authRoutes = require('../../routes/auth').default;
    app.use('/api/auth', authRoutes);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      // Create user first
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      await User.create({
        ...mockUser,
        password: hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: 'newpassword',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email
          // Missing password, firstName, lastName
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: '123', // Too short
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      await User.create({
        ...mockUser,
        password: hashedPassword
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: mockUser.password
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate required fields for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create and login a user to get auth token
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });
      userId = user._id.toString();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        });

      authToken = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user._id).toBe(userId);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toContain('No token');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      await User.create({
        ...mockUser,
        password: hashedPassword
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        });

      authToken = loginResponse.body.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out');
    });

    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.message).toContain('No token');
    });
  });

  describe('Performance Tests', () => {
    it('should handle registration within performance threshold', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle login within performance threshold', async () => {
      // Create user first
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      await User.create({
        ...mockUser,
        password: hashedPassword
      });

      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Security Tests', () => {
    it('should hash passwords before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(201);

      const user = await User.findOne({ email: mockUser.email });
      expect(user?.password).not.toBe(mockUser.password);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not expose password in responses', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,
          password: mockUser.password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        })
        .expect(201);

      expect(registerResponse.body.user).not.toHaveProperty('password');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        })
        .expect(200);

      expect(loginResponse.body.user).not.toHaveProperty('password');
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: mockUser.password
        })
        .expect(401);

      // Should not crash and should return proper error
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});