const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class FileStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.dealsFile = path.join(this.dataDir, 'deals.json');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      try {
        await fs.access(this.dealsFile);
      } catch {
        await fs.writeFile(this.dealsFile, JSON.stringify([]));
      }
    } catch (error) {
      logger.error('Error initializing storage:', error);
    }
  }

  async getAllDeals() {
    try {
      const data = await fs.readFile(this.dealsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error reading deals:', error);
      return [];
    }
  }

  async getDealById(id) {
    try {
      const deals = await this.getAllDeals();
      return deals.find(deal => deal.id === id);
    } catch (error) {
      logger.error('Error getting deal:', error);
      return null;
    }
  }

  async createDeal(dealData) {
    try {
      const deals = await this.getAllDeals();
      const newDeal = {
        id: Date.now().toString(), // Simple ID generation
        ...dealData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      deals.push(newDeal);
      await fs.writeFile(this.dealsFile, JSON.stringify(deals, null, 2));
      return newDeal;
    } catch (error) {
      logger.error('Error creating deal:', error);
      throw error;
    }
  }

  async updateDeal(id, dealData) {
    try {
      const deals = await this.getAllDeals();
      const index = deals.findIndex(deal => deal.id === id);
      if (index === -1) return null;

      const updatedDeal = {
        ...deals[index],
        ...dealData,
        updatedAt: new Date().toISOString()
      };
      deals[index] = updatedDeal;
      await fs.writeFile(this.dealsFile, JSON.stringify(deals, null, 2));
      return updatedDeal;
    } catch (error) {
      logger.error('Error updating deal:', error);
      throw error;
    }
  }

  async deleteDeal(id) {
    try {
      const deals = await this.getAllDeals();
      const filteredDeals = deals.filter(deal => deal.id !== id);
      await fs.writeFile(this.dealsFile, JSON.stringify(filteredDeals, null, 2));
      return true;
    } catch (error) {
      logger.error('Error deleting deal:', error);
      throw error;
    }
  }

  // Additional methods for deal analysis
  async saveDealAnalysis(dealId, analysisData) {
    try {
      const deals = await this.getAllDeals();
      const index = deals.findIndex(deal => deal.id === dealId);
      if (index === -1) return null;

      deals[index].analysis = {
        ...analysisData,
        analyzedAt: new Date().toISOString()
      };
      await fs.writeFile(this.dealsFile, JSON.stringify(deals, null, 2));
      return deals[index];
    } catch (error) {
      logger.error('Error saving deal analysis:', error);
      throw error;
    }
  }
}

module.exports = new FileStorage(); 