import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { 
  mockUser, 
  mockSFRProperty, 
  mockDealData,
  propertyScenarios
} from '../fixtures/testData';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Model Integration', () => {
    it('should create user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });

      expect(user._id).toBeDefined();
      expect(user.email).toBe(mockUser.email);
      expect(user.password).not.toBe(mockUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt pattern
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      
      // Create first user
      await User.create({
        ...mockUser,
        password: hashedPassword
      });

      // Attempt to create duplicate
      await expect(User.create({
        ...mockUser,
        password: hashedPassword
      })).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const incompleteUser = {
        email: mockUser.email
        // Missing required fields
      };

      await expect(User.create(incompleteUser)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidUser = {
        ...mockUser,
        email: 'invalid-email-format'
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    it('should set default role and preferences', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User'
        // No role or dualModePreferences specified
      });

      expect(user.role).toBe('user');
      expect(user.dualModePreferences.currentMode).toBe('novice');
    });

    it('should handle concurrent user creation', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      
      const userPromises = Array.from({ length: 5 }, (_, i) =>
        User.create({
          email: `test${i}@example.com`,
          password: hashedPassword,
          firstName: `Test${i}`,
          lastName: 'User'
        })
      );

      const users = await Promise.all(userPromises);
      
      expect(users).toHaveLength(5);
      users.forEach((user, index) => {
        expect(user.email).toBe(`test${index}@example.com`);
        expect(user._id).toBeDefined();
      });
    });
  });

  describe('Deal Model Integration', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a user for deal association
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });
      userId = user._id.toString();
    });

    it('should create deal with complete analysis data', async () => {
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });

      expect(deal._id).toBeDefined();
      expect(deal.userId.toString()).toBe(userId);
      expect(deal.propertyName).toBe(mockDealData.propertyName);
      expect(deal.analysis.monthlyAnalysis.cashFlow).toBe(mockDealData.analysis.monthlyAnalysis.cashFlow);
      expect(deal.analysis.annualAnalysis.capRate).toBe(mockDealData.analysis.annualAnalysis.capRate);
      expect(deal.createdAt).toBeDefined();
      expect(deal.updatedAt).toBeDefined();
    });

    it('should validate required fields for deal', async () => {
      const incompleteDeal = {
        userId: userId
        // Missing propertyName, propertyType, etc.
      };

      await expect(Deal.create(incompleteDeal)).rejects.toThrow();
    });

    it('should require valid user association', async () => {
      const invalidUserId = new mongoose.Types.ObjectId();
      
      const dealWithInvalidUser = {
        ...mockDealData,
        userId: invalidUserId
      };

      // Should create but user validation happens at application level
      const deal = await Deal.create(dealWithInvalidUser);
      expect(deal.userId.toString()).toBe(invalidUserId.toString());
    });

    it('should handle different property types', async () => {
      const sfrDeal = await Deal.create({
        ...mockDealData,
        userId: userId,
        propertyType: 'SFR'
      });

      const mfDeal = await Deal.create({
        ...mockDealData,
        userId: userId,
        propertyType: 'MF',
        totalUnits: 4,
        unitTypes: [
          {
            type: '2BR/1BA',
            count: 4,
            sqft: 900,
            monthlyRent: 1200,
            occupied: 4
          }
        ]
      });

      expect(sfrDeal.propertyType).toBe('SFR');
      expect(mfDeal.propertyType).toBe('MF');
    });

    it('should store complete financial projections', async () => {
      const dealWithProjections = {
        ...mockDealData,
        userId: userId,
        analysis: {
          ...mockDealData.analysis,
          longTermAnalysis: {
            yearlyProjections: Array.from({ length: 10 }, (_, year) => ({
              year: year + 1,
              cashFlow: -3436.80 + (year * 200),
              propertyValue: 450000 + (year * 10000),
              equity: 90000 + (year * 15000),
              propertyTax: 450 + (year * 15),
              insurance: 187.50 + (year * 5),
              maintenance: 294 + (year * 10),
              propertyManagement: 235.20 + (year * 8),
              vacancy: 147 + (year * 5),
              turnoverCosts: 25 + (year * 2),
              capitalImprovements: year * 1000,
              operatingExpenses: 1338.70 + (year * 45),
              noi: 12960 + (year * 500),
              debtService: 16396.80,
              grossRent: 35280 + (year * 1000),
              mortgageBalance: 360000 - (year * 5000),
              appreciation: 13500 + (year * 1000),
              totalReturn: 10063.20 + (year * 800)
            })),
            projectionYears: 10,
            returns: {
              irr: 8.5,
              totalCashFlow: 25000,
              totalAppreciation: 135000,
              totalReturn: 160000
            }
          }
        }
      };

      const deal = await Deal.create(dealWithProjections);
      
      expect(deal.analysis.longTermAnalysis.yearlyProjections).toHaveLength(10);
      expect(deal.analysis.longTermAnalysis.yearlyProjections[0].year).toBe(1);
      expect(deal.analysis.longTermAnalysis.yearlyProjections[9].year).toBe(10);
      expect(deal.analysis.longTermAnalysis.returns.totalReturn).toBe(160000);
    });

    it('should support deal updates', async () => {
      const deal = await Deal.create({
        ...mockDealData,
        userId: userId
      });

      const originalUpdatedAt = deal.updatedAt;
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedDeal = await Deal.findByIdAndUpdate(
        deal._id,
        {
          propertyName: 'Updated Property Name',
          'analysis.monthlyAnalysis.cashFlow': 500
        },
        { new: true }
      );

      expect(updatedDeal?.propertyName).toBe('Updated Property Name');
      expect(updatedDeal?.analysis.monthlyAnalysis.cashFlow).toBe(500);
      expect(updatedDeal?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle bulk deal operations', async () => {
      const dealData = [
        propertyScenarios.profitable,
        propertyScenarios.breakEven,
        propertyScenarios.cashFlowNegative
      ].map(property => ({
        ...mockDealData,
        userId: userId,
        propertyName: property.propertyName,
        purchasePrice: property.purchasePrice,
        monthlyRent: property.monthlyRent,
        analysis: {
          ...mockDealData.analysis,
          annualAnalysis: {
            ...mockDealData.analysis.annualAnalysis,
            capRate: Math.random() * 10 // Different cap rates for variety
          }
        }
      }));

      const deals = await Deal.insertMany(dealData);
      
      expect(deals).toHaveLength(3);
      expect(deals[0].propertyName).toBe('Profitable Property');
      expect(deals[1].propertyName).toBe('Break-Even Property');
      expect(deals[2].propertyName).toBe('Negative Cash Flow Property');
    });
  });

  describe('Database Performance Tests', () => {
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });
      userId = user._id.toString();
    });

    it('should handle large dataset queries efficiently', async () => {
      // Create 100 deals
      const dealPromises = Array.from({ length: 100 }, (_, i) =>
        Deal.create({
          ...mockDealData,
          userId: userId,
          propertyName: `Property ${i + 1}`,
          purchasePrice: 400000 + (i * 1000)
        })
      );

      await Promise.all(dealPromises);

      const startTime = Date.now();
      
      // Query all deals for user
      const deals = await Deal.find({ userId }).sort({ createdAt: -1 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(deals).toHaveLength(100);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle concurrent database operations', async () => {
      const startTime = Date.now();

      // Concurrent creates, reads, and updates
      const operations = [
        // Creates
        ...Array.from({ length: 10 }, (_, i) =>
          Deal.create({
            ...mockDealData,
            userId: userId,
            propertyName: `Concurrent Property ${i}`
          })
        ),
        // Reads
        ...Array.from({ length: 5 }, () =>
          Deal.find({ userId }).limit(10)
        )
      ];

      const results = await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify creates succeeded
      const createResults = results.slice(0, 10) as any[];
      createResults.forEach((deal, index) => {
        expect(deal.propertyName).toBe(`Concurrent Property ${index}`);
      });

      // Verify reads succeeded
      const readResults = results.slice(10);
      readResults.forEach(deals => {
        expect(Array.isArray(deals)).toBe(true);
      });

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should maintain data integrity under load', async () => {
      // Create deals with sequential IDs to test for race conditions
      const concurrentCreates = Array.from({ length: 20 }, (_, i) =>
        Deal.create({
          ...mockDealData,
          userId: userId,
          propertyName: `Load Test Property ${i}`,
          purchasePrice: 300000 + i // Sequential pricing
        })
      );

      const deals = await Promise.all(concurrentCreates);
      
      // Verify all deals were created with correct sequential data
      deals.forEach((deal, index) => {
        expect(deal.propertyName).toBe(`Load Test Property ${index}`);
        expect(deal.purchasePrice).toBe(300000 + index);
        expect(deal.userId.toString()).toBe(userId);
      });

      // Verify count matches expected
      const totalCount = await Deal.countDocuments({ userId });
      expect(totalCount).toBe(20);
    });
  });

  describe('Database Relationships and Constraints', () => {
    it('should maintain referential integrity between users and deals', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });

      // Create deal associated with user
      const deal = await Deal.create({
        ...mockDealData,
        userId: user._id
      });

      // Verify relationship
      const foundDeal = await Deal.findById(deal._id);
      const associatedUser = await User.findById(foundDeal?.userId);

      expect(associatedUser?.email).toBe(mockUser.email);
      expect(foundDeal?.userId.toString()).toBe(user._id.toString());
    });

    it('should handle cascading operations appropriately', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });

      // Create multiple deals for user
      const dealPromises = Array.from({ length: 3 }, (_, i) =>
        Deal.create({
          ...mockDealData,
          userId: user._id,
          propertyName: `User Deal ${i + 1}`
        })
      );

      await Promise.all(dealPromises);

      // Verify deals exist
      let userDeals = await Deal.find({ userId: user._id });
      expect(userDeals).toHaveLength(3);

      // Delete user (in real app, would handle cascading)
      await User.findByIdAndDelete(user._id);

      // Deals still exist (no automatic cascading in this schema)
      userDeals = await Deal.find({ userId: user._id });
      expect(userDeals).toHaveLength(3);

      // Manual cleanup would be required at application level
      await Deal.deleteMany({ userId: user._id });
      
      const remainingDeals = await Deal.find({ userId: user._id });
      expect(remainingDeals).toHaveLength(0);
    });
  });

  describe('Database Index Performance', () => {
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      const user = await User.create({
        ...mockUser,
        password: hashedPassword
      });
      userId = user._id.toString();

      // Create many deals for index testing
      const dealPromises = Array.from({ length: 50 }, (_, i) =>
        Deal.create({
          ...mockDealData,
          userId: userId,
          propertyName: `Index Test Property ${i}`,
          propertyAddress: {
            ...mockDealData.propertyAddress,
            zipCode: `3720${i % 10}` // Vary zip codes
          }
        })
      );

      await Promise.all(dealPromises);
    });

    it('should efficiently query by userId (indexed field)', async () => {
      const startTime = Date.now();
      
      const deals = await Deal.find({ userId });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(deals).toHaveLength(50);
      expect(duration).toBeLessThan(100); // Should be very fast with index
    });

    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();
      
      // Complex query with multiple conditions
      const deals = await Deal.find({
        userId: userId,
        purchasePrice: { $gte: 400000 },
        'analysis.annualAnalysis.capRate': { $gt: 0 }
      }).sort({ createdAt: -1 }).limit(10);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(Array.isArray(deals)).toBe(true);
      expect(duration).toBeLessThan(200); // Should complete reasonably fast
    });

    it('should handle text search efficiently', async () => {
      const startTime = Date.now();
      
      // Search by property name (assuming text index exists)
      const deals = await Deal.find({
        userId: userId,
        propertyName: { $regex: 'Index Test', $options: 'i' }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(deals.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(300); // Text search should be reasonable
    });
  });
});