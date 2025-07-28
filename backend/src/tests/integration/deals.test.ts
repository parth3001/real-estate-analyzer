import request from 'supertest';
import express, { Express } from 'express';
import nock from 'nock';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { 
  mockUser, 
  mockDealData, 
  mockFredResponse, 
  mockRentcastResponse,
  validAuthToken 
} from '../fixtures/testData';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import bcrypt from 'bcryptjs';

let app: Express;
let authToken: string;
let userId: string;

describe('Deals API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
    
    // Create minimal express app for testing
    app = express();
    app.use(express.json());
    
    // Import and use deals routes
    const dealsRoutes = require('../../routes/deals').default;
    app.use('/api/deals', dealsRoutes);
  });

  afterAll(async () => {
    await closeTestDB();
    nock.cleanAll();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create authenticated user for tests
    const hashedPassword = await bcrypt.hash(mockUser.password, 10);
    const user = await User.create({
      ...mockUser,
      password: hashedPassword
    });
    userId = user._id.toString();
    
    // Mock login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password
      });
    
    authToken = loginResponse.body.token;
  });

  describe('POST /api/deals/analyze', () => {
    beforeEach(() => {
      // Mock external API calls
      nock('https://api.stlouisfed.org')
        .get(/.*/)
        .reply(200, mockFredResponse)
        .persist();
        
      nock('https://api.rentcast.io')
        .get(/.*/)
        .reply(200, mockRentcastResponse)
        .persist();
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should analyze SFR property successfully', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      expect(response.body).toHaveProperty('monthlyAnalysis');
      expect(response.body).toHaveProperty('annualAnalysis');
      expect(response.body).toHaveProperty('keyMetrics');
      expect(response.body).toHaveProperty('longTermAnalysis');
      
      // Verify key metrics are calculated
      expect(response.body.monthlyAnalysis).toHaveProperty('cashFlow');
      expect(response.body.keyMetrics).toHaveProperty('capRate');
      expect(response.body.keyMetrics).toHaveProperty('cashOnCashReturn');
      expect(response.body.keyMetrics).toHaveProperty('debtServiceCoverageRatio');
    });

    it('should include market intelligence in analysis', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      expect(response.body).toHaveProperty('marketIntelligence');
      expect(response.body.marketIntelligence).toHaveProperty('propertyData');
      expect(response.body.marketIntelligence).toHaveProperty('economicData');
    });

    it('should include AI insights when available', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      expect(response.body).toHaveProperty('aiInsights');
      expect(response.body.aiInsights).toHaveProperty('summary');
      expect(response.body.aiInsights).toHaveProperty('investmentScore');
    });

    it('should validate required property data fields', async () => {
      const incompleteProperty = {
        propertyType: 'SFR',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteProperty)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle analysis for different property types', async () => {
      const mfProperty = {
        ...mockDealData,
        propertyType: 'MF',
        totalUnits: 4,
        unitTypes: [
          {
            type: '2BR/1BA',
            count: 4,
            sqft: 900,
            monthlyRent: 2000,
            occupied: 4
          }
        ]
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mfProperty)
        .expect(200);

      expect(response.body).toHaveProperty('monthlyAnalysis');
      expect(response.body).toHaveProperty('keyMetrics');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .send(mockDealData)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should handle external API failures gracefully', async () => {
      // Mock API failure
      nock.cleanAll();
      nock('https://api.stlouisfed.org')
        .get(/.*/)
        .reply(500, { error: 'Service unavailable' });

      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200); // Should still work with default values

      expect(response.body).toHaveProperty('monthlyAnalysis');
      // Should include a warning about market data unavailability
      expect(response.body).toHaveProperty('warnings');
    });

    it('should complete analysis within performance threshold', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('POST /api/deals', () => {
    it('should save a new deal successfully', async () => {
      const response = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.propertyName).toBe(mockDealData.propertyName);
      expect(response.body.userId).toBe(userId);
    });

    it('should validate deal data before saving', async () => {
      const invalidDeal = {
        propertyData: {
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDeal)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should require authentication to save deals', async () => {
      const response = await request(app)
        .post('/api/deals')
        .send(mockDealData)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should associate deal with authenticated user', async () => {
      const response = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(201);

      expect(response.body.userId).toBe(userId);
    });
  });

  describe('GET /api/deals', () => {
    let savedDealId: string;

    beforeEach(async () => {
      // Create a test deal
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });
      savedDealId = deal._id.toString();
    });

    it('should get all deals for authenticated user', async () => {
      const response = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id).toBe(savedDealId);
    });

    it('should only return deals for current user', async () => {
      // Create another user and deal
      const anotherUser = await User.create({
        email: 'other@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Other',
        lastName: 'User'
      });

      await Deal.create({
        ...mockDealData,
        userId: anotherUser._id
      });

      const response = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only return the deal for the authenticated user
      expect(response.body.length).toBe(1);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/deals')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    it('should handle pagination', async () => {
      // Create multiple deals
      const dealPromises = Array.from({ length: 15 }, (_, i) => 
        Deal.create({
          ...mockDealData,
          userId: userId,
          propertyName: `Test Property ${i + 1}`,
          purchasePrice: mockDealData.purchasePrice,
          monthlyRent: mockDealData.monthlyRent
        })
      );
      await Promise.all(dealPromises);

      const response = await request(app)
        .get('/api/deals?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(10);
      expect(response.headers).toHaveProperty('x-total-count');
    });
  });

  describe('GET /api/deals/:id', () => {
    let savedDealId: string;

    beforeEach(async () => {
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });
      savedDealId = deal._id.toString();
    });

    it('should get specific deal by ID', async () => {
      const response = await request(app)
        .get(`/api/deals/${savedDealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(savedDealId);
      expect(response.body.propertyName).toBe(mockDealData.propertyName);
    });

    it('should not get deal that belongs to another user', async () => {
      // Create another user and deal
      const anotherUser = await User.create({
        email: 'other@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Other',
        lastName: 'User'
      });

      const otherDeal = await Deal.create({
        ...mockDealData,
        userId: anotherUser._id
      });

      const response = await request(app)
        .get(`/api/deals/${otherDeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent deal', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/deals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid deal ID format', async () => {
      const response = await request(app)
        .get('/api/deals/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('PUT /api/deals/:id', () => {
    let savedDealId: string;

    beforeEach(async () => {
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });
      savedDealId = deal._id.toString();
    });

    it('should update deal successfully', async () => {
      const updateData = {
        propertyName: 'Updated Property Name',
        purchasePrice: mockDealData.purchasePrice
      };

      const response = await request(app)
        .put(`/api/deals/${savedDealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.propertyData.propertyName).toBe('Updated Property Name');
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should not update deal that belongs to another user', async () => {
      const anotherUser = await User.create({
        email: 'other@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Other',
        lastName: 'User'
      });

      const otherDeal = await Deal.create({
        ...mockDealData,
        userId: anotherUser._id
      });

      const response = await request(app)
        .put(`/api/deals/${otherDeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ propertyData: { propertyName: 'Hacked' } })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/deals/:id', () => {
    let savedDealId: string;

    beforeEach(async () => {
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });
      savedDealId = deal._id.toString();
    });

    it('should delete deal successfully', async () => {
      const response = await request(app)
        .delete(`/api/deals/${savedDealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deal is actually deleted
      const deletedDeal = await Deal.findById(savedDealId);
      expect(deletedDeal).toBeNull();
    });

    it('should not delete deal that belongs to another user', async () => {
      const anotherUser = await User.create({
        email: 'other@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Other',
        lastName: 'User'
      });

      const otherDeal = await Deal.create({
        ...mockDealData,
        userId: anotherUser._id
      });

      const response = await request(app)
        .delete(`/api/deals/${otherDeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');

      // Verify deal still exists
      const stillExistsDeal = await Deal.findById(otherDeal._id);
      expect(stillExistsDeal).not.toBeNull();
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle multiple concurrent analysis requests', async () => {
      const concurrentRequests = 5;
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/api/deals/analyze')
          .set('Authorization', `Bearer ${authToken}`)
          .send(mockDealData)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should handle large datasets efficiently', async () => {
      // Create a large property with many projections
      const largeProperty = {
        ...mockDealData,
        longTermAssumptions: {
          projectionYears: 30, // Longer projection period
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2,
          vacancyRate: 5,
          turnoverFrequency: 2
        }
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeProperty)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.longTermAnalysis.projections).toHaveLength(30);
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
    });
  });
});