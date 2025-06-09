import { DealData, PropertyType, SavedDeal, SFRDealData, MultiFamilyDealData } from '../../types/deal';
import { Analysis } from '../../types/analysis';
import { adaptAnalysisResponse } from '../../utils/analysisAdapter';

// Add BackendDeal interface for proper typing
interface BackendDeal {
  _id?: string;
  id?: string;
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  yearBuilt?: number;
  propertyTaxRate?: number;
  insuranceRate?: number;
  propertyManagementRate?: number;
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  maintenanceCost?: number;
  totalUnits?: number;
  totalSqft?: number;
  maintenanceCostPerUnit?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  commonAreaUtilities?: {
    electric?: number;
    water?: number;
    gas?: number;
    trash?: number;
    [key: string]: number | undefined;
  };
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    inflationRate: number;
    vacancyRate: number;
    capitalExpenditureRate?: number;
    commonAreaMaintenanceRate?: number;
  };
  analysis?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Define a local CommonAreaUtilitiesWithIndex interface to match the expected structure
interface CommonAreaUtilitiesWithIndex {
  electric: number;
  water: number;
  gas: number;
  trash: number;
  [key: string]: number; // Add index signature to match expected type
}

// Add interface for payload structure
interface DealPayload extends Record<string, unknown> {
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  yearBuilt: number;
  propertyManagementRate: number;
  closingCosts?: number;
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  maintenanceCost?: number;
  totalUnits?: number;
  totalSqft?: number;
  maintenanceCostPerUnit?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  commonAreaUtilities?: CommonAreaUtilitiesWithIndex;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    inflationRate: number;
    vacancyRate: number;
    capitalExpenditureRate?: number;
    commonAreaMaintenanceRate?: number;
  };
  analysis?: Record<string, unknown>;
}

// Fix environment variable access to be compatible with both CRA and Vite
const API_URL = 
  // Try Vite style env vars
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  // Try CRA style env vars
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  // Fallback
  'http://localhost:3001';

/**
 * Deal Data Access Object - provides a clean interface for all deal-related
 * API operations, with proper error handling and data transformation
 */
export class DealDAO {
  /**
   * Fetch all deals from the backend
   */
  async getAllDeals(): Promise<SavedDeal[]> {
    try {
      const response = await fetch(`${API_URL}/api/deals`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.status}`);
      }
      
      const deals = await response.json();
      return this.mapDealsFromBackend(deals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      
      // Fallback to localStorage if API fails
      return this.getAllDealsFromLocalStorage();
    }
  }
  
  /**
   * Fetch deals by property type
   */
  async getDealsByType(propertyType: PropertyType): Promise<SavedDeal[]> {
    try {
      const response = await fetch(`${API_URL}/api/deals/type/${propertyType}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${propertyType} deals: ${response.status}`);
      }
      
      const deals = await response.json();
      return this.mapDealsFromBackend(deals);
    } catch (error) {
      console.error(`Error fetching ${propertyType} deals:`, error);
      
      // Fallback to localStorage filtering if API fails
      const allDeals = await this.getAllDealsFromLocalStorage();
      return allDeals.filter(deal => deal.type === propertyType);
    }
  }
  
  /**
   * Fetch a specific deal by ID
   */
  async getDealById(id: string): Promise<SavedDeal | null> {
    try {
      const response = await fetch(`${API_URL}/api/deals/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deal: ${response.status}`);
      }
      
      const deal = await response.json();
      return this.mapDealFromBackend(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      
      // Fallback to localStorage if API fails
      const allDeals = await this.getAllDealsFromLocalStorage();
      return allDeals.find(deal => deal.id === id) || null;
    }
  }
  
  /**
   * Save a deal (create or update)
   */
  async saveDeal(dealData: DealData, analysisResult: Analysis | null): Promise<SavedDeal | null> {
    try {
      // Prepare API payload
      const payload = this.prepareApiPayload(dealData, analysisResult);
      
      // Determine if this is a create or update operation
      const method = dealData.id ? 'PUT' : 'POST';
      const url = dealData.id 
        ? `${API_URL}/api/deals/${dealData.id}` 
        : `${API_URL}/api/deals`;
      
      // Send request to API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.status}`);
      }
      
      const savedDeal = await response.json();
      const mappedDeal = this.mapDealFromBackend(savedDeal);
      
      // Also save to localStorage for offline support
      if (mappedDeal) {
        this.saveToLocalStorage(mappedDeal, dealData, analysisResult);
      }
      
      return mappedDeal;
    } catch (error) {
      console.error('Error saving deal:', error);
      
      // Fallback to localStorage-only saving if API fails
      return this.saveToLocalStorageOnly(dealData, analysisResult);
    }
  }
  
  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/deals/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete deal: ${response.status}`);
      }
      
      // Also remove from localStorage
      this.deleteFromLocalStorage(id);
      
      return true;
    } catch (error) {
      console.error('Error deleting deal:', error);
      
      // Fallback to localStorage-only deletion if API fails
      this.deleteFromLocalStorage(id);
      return true;
    }
  }
  
  /**
   * Analyze a deal without saving
   */
  async analyzeDeal(dealData: DealData): Promise<Analysis> {
    console.log('Sending analysis request with data:', dealData);
    
    // Create properly formatted payload with explicit number conversions
    const payload = this.prepareApiPayload(dealData, null);
    
    try {
      const response = await fetch(`${API_URL}/api/deals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Add request data for the adapter
      if (!result.requestData) {
        result.requestData = {
          downPayment: dealData.downPayment,
          purchasePrice: dealData.purchasePrice,
          closingCosts: 'closingCosts' in dealData ? dealData.closingCosts : 0,
          propertyType: dealData.propertyType
        };
      }
      
      // Convert backend response to frontend Analysis type
      return adaptAnalysisResponse(result);
    } catch (error) {
      console.error('Error analyzing deal:', error);
      throw error;
    }
  }
  
  // --- Helper methods ---
  
  /**
   * Map backend deal data to frontend SavedDeal format
   */
  private mapDealFromBackend(backendDeal: BackendDeal): SavedDeal | null {
    if (!backendDeal) return null;
    
    try {
      const propertyType = backendDeal.propertyType as PropertyType;
      
      return {
        id: backendDeal._id || backendDeal.id || '',
        name: backendDeal.propertyName,
        type: propertyType,
        data: {
          id: backendDeal._id || backendDeal.id || '',
          propertyName: backendDeal.propertyName,
          propertyType: propertyType,
          propertyAddress: backendDeal.propertyAddress,
          purchasePrice: backendDeal.purchasePrice,
          downPayment: backendDeal.downPayment,
          interestRate: backendDeal.interestRate,
          loanTerm: backendDeal.loanTerm,
          yearBuilt: backendDeal.yearBuilt || 0,
          propertyTaxRate: backendDeal.propertyTaxRate || 0,
          insuranceRate: backendDeal.insuranceRate || 0,
          propertyManagementRate: backendDeal.propertyManagementRate || 0,
          
          // SFR specific
          ...propertyType === 'SFR' ? {
            monthlyRent: backendDeal.monthlyRent || 0,
            squareFootage: backendDeal.squareFootage || 0,
            bedrooms: backendDeal.bedrooms || 0,
            bathrooms: backendDeal.bathrooms || 0,
            maintenanceCost: backendDeal.maintenanceCost || 0,
          } : {},
          
          // MF specific
          ...propertyType === 'MF' ? {
            totalUnits: backendDeal.totalUnits || 0,
            totalSqft: backendDeal.totalSqft || 0,
            maintenanceCostPerUnit: backendDeal.maintenanceCostPerUnit || 0,
            unitTypes: backendDeal.unitTypes || [],
            commonAreaUtilities: backendDeal.commonAreaUtilities || {},
          } : {},
          
          // Common additional fields
          longTermAssumptions: backendDeal.longTermAssumptions,
          closingCosts: backendDeal.closingCosts,
          
          // Analysis results if available
          analysisResult: backendDeal.analysis ? adaptAnalysisResponse(backendDeal.analysis) : undefined
        },
        savedAt: backendDeal.createdAt || new Date().toISOString(),
        lastModified: backendDeal.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error mapping backend deal:', error);
      return null;
    }
  }
  
  /**
   * Map an array of backend deals to frontend SavedDeal format
   */
  private mapDealsFromBackend(backendDeals: BackendDeal[]): SavedDeal[] {
    return backendDeals
      .map(deal => this.mapDealFromBackend(deal))
      .filter((deal): deal is SavedDeal => deal !== null);
  }
  
  /**
   * Convert frontend DealData to backend API payload
   */
  private prepareApiPayload(dealData: DealData, analysisResult: Analysis | null): DealPayload {
    const payload: DealPayload = {
      propertyName: dealData.propertyAddress.street 
        ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
        : 'Untitled Deal',
      propertyType: dealData.propertyType,
      propertyAddress: dealData.propertyAddress,
      purchasePrice: Number(dealData.purchasePrice) || 0,
      downPayment: Number(dealData.downPayment) || 0,
      interestRate: Number(dealData.interestRate) || 0,
      loanTerm: Number(dealData.loanTerm) || 30,
      propertyTaxRate: Number(dealData.propertyTaxRate) || 0,
      insuranceRate: Number(dealData.insuranceRate) || 0,
      yearBuilt: Number(dealData.yearBuilt) || 0,
      propertyManagementRate: Number(dealData.propertyManagementRate) || 0,
    };
    
    if ('closingCosts' in dealData) {
      payload.closingCosts = Number(dealData.closingCosts) || 0;
    }
    
    // Add property type specific fields
    if (dealData.propertyType === 'SFR') {
      const sfrData = dealData as SFRDealData;
      payload.monthlyRent = Number(sfrData.monthlyRent) || 0;
      payload.squareFootage = Number(sfrData.squareFootage) || 0;
      payload.bedrooms = Number(sfrData.bedrooms) || 0;
      payload.bathrooms = Number(sfrData.bathrooms) || 0;
      payload.maintenanceCost = Number(sfrData.maintenanceCost) || 0;
    } else if (dealData.propertyType === 'MF') {
      const mfData = dealData as MultiFamilyDealData;
      payload.totalUnits = Number(mfData.totalUnits) || 0;
      payload.totalSqft = Number(mfData.totalSqft) || 0;
      payload.maintenanceCostPerUnit = Number(mfData.maintenanceCostPerUnit) || 0;
      payload.unitTypes = mfData.unitTypes || [];
      
      // Create a new object with the required properties and add an index signature
      const utilities = mfData.commonAreaUtilities || {};
      const extendedUtilities: CommonAreaUtilitiesWithIndex = {
        electric: utilities.electric || 0,
        water: utilities.water || 0,
        gas: utilities.gas || 0,
        trash: utilities.trash || 0,
      };
      
      payload.commonAreaUtilities = extendedUtilities;
    }
    
    // Add long term assumptions
    if (dealData.longTermAssumptions) {
      payload.longTermAssumptions = {
        projectionYears: Number(dealData.longTermAssumptions.projectionYears) || 10,
        annualRentIncrease: Number(dealData.longTermAssumptions.annualRentIncrease) || 2,
        annualPropertyValueIncrease: Number(dealData.longTermAssumptions.annualPropertyValueIncrease) || 3,
        sellingCostsPercentage: Number(dealData.longTermAssumptions.sellingCostsPercentage) || 6,
        inflationRate: Number(dealData.longTermAssumptions.inflationRate) || 2,
        vacancyRate: Number(dealData.longTermAssumptions.vacancyRate) || 5
      };
      
      // Add MF specific assumptions if applicable
      if (dealData.propertyType === 'MF' && 'capitalExpenditureRate' in dealData.longTermAssumptions) {
        const mfAssumptions = dealData.longTermAssumptions as MultiFamilyDealData['longTermAssumptions'];
        if (payload.longTermAssumptions && mfAssumptions) {
          payload.longTermAssumptions.capitalExpenditureRate = 
            Number(mfAssumptions.capitalExpenditureRate) || 0;
          payload.longTermAssumptions.commonAreaMaintenanceRate = 
            Number(mfAssumptions.commonAreaMaintenanceRate) || 0;
        }
      }
    }
    
    // Add analysis results if available
    if (analysisResult) {
      payload.analysis = {
        monthlyAnalysis: analysisResult.monthlyAnalysis || {},
        annualAnalysis: analysisResult.annualAnalysis || {},
        longTermAnalysis: analysisResult.longTermAnalysis || {},
        keyMetrics: analysisResult.keyMetrics || {},
        aiInsights: analysisResult.aiInsights || {}
      };
    }
    
    return payload;
  }
  
  /**
   * Get all deals from localStorage
   */
  private async getAllDealsFromLocalStorage(): Promise<SavedDeal[]> {
    try {
      const savedAnalysesStr = localStorage.getItem('savedAnalyses');
      return savedAnalysesStr ? JSON.parse(savedAnalysesStr) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Save a deal to localStorage
   */
  private saveToLocalStorage(
    savedDeal: SavedDeal,
    _dealData: DealData,
    _analysisResult: Analysis | null
  ): void {
    try {
      // Get existing saved deals
      const savedAnalysesStr = localStorage.getItem('savedAnalyses');
      let savedAnalyses: SavedDeal[] = [];
      
      if (savedAnalysesStr) {
        savedAnalyses = JSON.parse(savedAnalysesStr);
      }
      
      // Update or add the deal
      const existingIndex = savedAnalyses.findIndex(a => a.id === savedDeal.id);
      if (existingIndex >= 0) {
        savedAnalyses[existingIndex] = savedDeal;
      } else {
        savedAnalyses.push(savedDeal);
      }
      
      // Save back to localStorage
      localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  /**
   * Fallback: Save deal only to localStorage when API fails
   */
  private saveToLocalStorageOnly(
    dealData: DealData,
    analysisResult: Analysis | null
  ): SavedDeal | null {
    try {
      const id = dealData.id || `local-${Date.now()}`;
      const now = new Date().toISOString();
      
      const savedDeal: SavedDeal = {
        id,
        name: dealData.propertyAddress.street 
          ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
          : 'Untitled Deal',
        type: dealData.propertyType,
        data: {
          ...dealData,
          id,
          analysisResult: analysisResult || undefined
        },
        savedAt: now,
        lastModified: now
      };
      
      // Save to localStorage
      this.saveToLocalStorage(savedDeal, dealData, analysisResult);
      
      return savedDeal;
    } catch (error) {
      console.error('Error saving to localStorage only:', error);
      return null;
    }
  }
  
  /**
   * Delete a deal from localStorage
   */
  private deleteFromLocalStorage(id: string): void {
    try {
      const savedAnalysesStr = localStorage.getItem('savedAnalyses');
      
      if (savedAnalysesStr) {
        let savedAnalyses: SavedDeal[] = JSON.parse(savedAnalysesStr);
        savedAnalyses = savedAnalyses.filter(deal => deal.id !== id);
        localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
      }
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }
}

// Export a singleton instance
export const dealDAO = new DealDAO(); 