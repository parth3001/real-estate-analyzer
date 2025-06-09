import { SavedDeal, DealData, SFRDealData, MultiFamilyDealData, PropertyType, LongTermAssumptions } from '../types/deal';
import { v4 as uuidv4 } from 'uuid';
import { Analysis } from '../types/analysis';
import { adaptAnalysisResponse } from '../utils/analysisAdapter';
import { Logger } from '../utils/logger';

// Fix environment variable access to be compatible with both CRA and Vite
const API_URL = 
  // Try Vite style env vars
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  // Try CRA style env vars
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  // Fallback
  'http://localhost:3001';

// Define a type for the backend deal response
interface BackendDeal {
  _id?: string;
  id?: string;
  propertyName: string;
  propertyType: 'SFR' | 'MF';
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
  // SFR specific
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  maintenanceCost?: number;
  // MF specific
  totalUnits?: number;
  totalSqft?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  // And other properties...
  analysis?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export class DealService {
  static async getDealById(id: string): Promise<SavedDeal | null> {
    try {
      Logger.info(`Fetching deal with ID: ${id}`);
      const response = await fetch(`${API_URL}/api/deals/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deal: ${response.status}`);
      }
      
      const deal = await response.json();
      Logger.info(`Successfully fetched deal: ${JSON.stringify(deal).substring(0, 200)}...`);
      return this.mapDealFromBackend(deal);
    } catch (error) {
      Logger.error('Error getting deal:', error);
      
      // Fallback to localStorage if API fails
      try {
        const dealsStr = localStorage.getItem('savedDeals');
        const deals: SavedDeal[] = dealsStr ? JSON.parse(dealsStr) : [];
        return deals.find(deal => deal.id === id) || null;
      } catch (localError) {
        Logger.error('Error getting deal from localStorage:', localError);
        return null;
      }
    }
  }

  static async saveDeal(
    dealData: DealData, 
    analysisResult: Analysis | null
  ): Promise<SavedDeal | null> {
    try {
      const dealName = dealData.propertyAddress.street 
        ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
        : 'Untitled Deal';

      // Enhanced logging for debugging
      console.log(`[DealService] Saving deal: ${dealName}`);
      console.log(`[DealService] Deal data propertyType: ${dealData.propertyType}`);
      console.log(`[DealService] Deal ID: ${dealData.id || 'new deal'}`);
      console.log(`[DealService] Analysis result present: ${analysisResult ? 'Yes' : 'No'}`);
      
      if (analysisResult) {
        console.log(`[DealService] Analysis result NOI: ${analysisResult.annualAnalysis?.annualNOI}`);
        console.log(`[DealService] Analysis result cashFlow: ${analysisResult.monthlyAnalysis?.cashFlow}`);
      }

      // Prepare the payload for the API with correct structure for MongoDB
      const payload: Record<string, unknown> = {
        propertyName: dealName,
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

      // Add type-specific fields with explicit Number conversions and null/undefined handling
      if (dealData.propertyType === 'SFR') {
        const sfrData = dealData as SFRDealData;
        payload.monthlyRent = Number(sfrData.monthlyRent) || 0;
        payload.squareFootage = Number(sfrData.squareFootage) || 0;
        payload.bedrooms = Number(sfrData.bedrooms) || 0;
        payload.bathrooms = Number(sfrData.bathrooms) || 0;
        payload.maintenanceCost = Number(sfrData.maintenanceCost) * 12 || 0; // Convert monthly to annual
        
        if (sfrData.longTermAssumptions) {
          payload.longTermAssumptions = {
            projectionYears: Number(sfrData.longTermAssumptions.projectionYears) || 10,
            annualRentIncrease: Number(sfrData.longTermAssumptions.annualRentIncrease) || 0,
            annualPropertyValueIncrease: Number(sfrData.longTermAssumptions.annualPropertyValueIncrease) || 0,
            sellingCostsPercentage: Number(sfrData.longTermAssumptions.sellingCostsPercentage) || 0,
            inflationRate: Number(sfrData.longTermAssumptions.inflationRate) || 0,
            vacancyRate: Number(sfrData.longTermAssumptions.vacancyRate) || 0
          };
        }
      } else if (dealData.propertyType === 'MF') {
        const mfData = dealData as MultiFamilyDealData;
        payload.totalUnits = Number(mfData.totalUnits) || 0;
        payload.totalSqft = Number(mfData.totalSqft) || 0;
        payload.maintenanceCostPerUnit = Number(mfData.maintenanceCostPerUnit) || 0;
        payload.unitTypes = mfData.unitTypes || [];
        payload.commonAreaUtilities = mfData.commonAreaUtilities || {
          electric: 0,
          water: 0,
          gas: 0,
          trash: 0
        };
        
        if (mfData.longTermAssumptions) {
          payload.longTermAssumptions = {
            projectionYears: Number(mfData.longTermAssumptions.projectionYears) || 10,
            annualRentIncrease: Number(mfData.longTermAssumptions.annualRentIncrease) || 0,
            annualPropertyValueIncrease: Number(mfData.longTermAssumptions.annualPropertyValueIncrease) || 0,
            sellingCostsPercentage: Number(mfData.longTermAssumptions.sellingCostsPercentage) || 0,
            inflationRate: Number(mfData.longTermAssumptions.inflationRate) || 0,
            vacancyRate: Number(mfData.longTermAssumptions.vacancyRate) || 0
          };
        }
      }

      // Add analysis data in the correct structure for MongoDB
      if (analysisResult) {
        // Ensure we have valid numbers by converting all values and providing defaults
        const safeMonthlyAnalysis = {
          expenses: {
            propertyTax: Number(analysisResult.monthlyAnalysis?.expenses?.propertyTax) || 0,
            insurance: Number(analysisResult.monthlyAnalysis?.expenses?.insurance) || 0,
            maintenance: Number(analysisResult.monthlyAnalysis?.expenses?.maintenance) || 0,
            propertyManagement: Number(analysisResult.monthlyAnalysis?.expenses?.propertyManagement) || 0,
            vacancy: Number(analysisResult.monthlyAnalysis?.expenses?.vacancy) || 0,
            total: Number(analysisResult.monthlyAnalysis?.expenses?.total) || 0,
          },
          cashFlow: Number(analysisResult.monthlyAnalysis?.cashFlow) || 0
        };
        
        const safeAnnualAnalysis = {
          dscr: Number(analysisResult.annualAnalysis?.dscr) || 0,
          cashOnCashReturn: Number(analysisResult.annualAnalysis?.cashOnCashReturn) || 0,
          capRate: Number(analysisResult.annualAnalysis?.capRate) || 0,
          totalInvestment: Number(analysisResult.annualAnalysis?.totalInvestment) || 0,
          annualNOI: Number(analysisResult.annualAnalysis?.annualNOI) || 0,
          annualDebtService: Number(analysisResult.annualAnalysis?.annualDebtService) || 0,
          effectiveGrossIncome: Number(analysisResult.annualAnalysis?.effectiveGrossIncome) || 0
        };
        
        payload.analysis = {
          monthlyAnalysis: safeMonthlyAnalysis,
          annualAnalysis: safeAnnualAnalysis,
          longTermAnalysis: analysisResult.longTermAnalysis || {},
          keyMetrics: analysisResult.keyMetrics || {},
          aiInsights: analysisResult.aiInsights || {}
        };
      }

      console.log(`[DealService] Final payload for API:`, JSON.stringify(payload).substring(0, 500) + '...');

      // Check if we're updating an existing deal
      let response;
      if (dealData.id) {
        console.log(`[DealService] Updating existing deal with ID: ${dealData.id}`);
        // Update existing deal
        response = await fetch(`${API_URL}/api/deals/${dealData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        console.log('[DealService] Creating new deal');
        // Create new deal
        response = await fetch(`${API_URL}/api/deals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      // Log detailed response information
      console.log(`[DealService] API Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DealService] API error response (${response.status}):`, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      }
      
      const savedDeal = await response.json();
      console.log(`[DealService] Deal saved successfully, received ID: ${savedDeal._id || savedDeal.id}`);
      return this.mapDealFromBackend(savedDeal);
    } catch (error) {
      console.error('[DealService] Error saving deal to API:', error);
      
      // Fallback to localStorage if API fails
      try {
        const deals: SavedDeal[] = await this.getAllDealsFromLocalStorage();
        
        const deal: SavedDeal = {
          id: dealData.id || uuidv4(),
          name: dealData.propertyAddress.street 
            ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
            : 'Untitled Deal',
          type: dealData.propertyType, 
          data: {
            ...dealData,
            id: dealData.id, // Preserve ID in data
            analysisResult: analysisResult || undefined
          },
          savedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        // Check if we're updating an existing deal
        const existingDealIndex = dealData.id 
          ? deals.findIndex(d => d.id === dealData.id)
          : -1;

        if (existingDealIndex >= 0) {
          deals[existingDealIndex] = deal;
        } else {
          deals.push(deal);
        }

        localStorage.setItem('savedDeals', JSON.stringify(deals));
        return deal;
      } catch (localError) {
        Logger.error('Error saving deal to localStorage:', localError);
        return null;
      }
    }
  }

  static async saveSFRDeal(
    dealData: SFRDealData, 
    analysisResult: Analysis | null
  ): Promise<SavedDeal | null> {
    return this.saveDeal(dealData, analysisResult);
  }
  
  static async saveMFDeal(
    dealData: MultiFamilyDealData, 
    analysisResult: Analysis | null
  ): Promise<SavedDeal | null> {
    return this.saveDeal(dealData, analysisResult);
  }

  static async getAllDeals(): Promise<SavedDeal[]> {
    try {
      Logger.info('Fetching all deals from API');
      const response = await fetch(`${API_URL}/api/deals`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.status}`);
      }
      
      const deals = await response.json();
      Logger.info(`Fetched ${deals.length} deals from API`);
      return deals.map(this.mapDealFromBackend);
    } catch (error) {
      Logger.error('Error getting all deals from API:', error);
      
      // Fallback to localStorage if API fails
      return this.getAllDealsFromLocalStorage();
    }
  }

  // Helper method to get deals from localStorage as fallback
  private static async getAllDealsFromLocalStorage(): Promise<SavedDeal[]> {
    try {
      const dealsStr = localStorage.getItem('savedDeals');
      return dealsStr ? JSON.parse(dealsStr) : [];
    } catch (error) {
      Logger.error('Error getting all deals from localStorage:', error);
      return [];
    }
  }

  static async getDealsByType(type: PropertyType): Promise<SavedDeal[]> {
    try {
      const deals = await this.getAllDeals();
      return deals.filter(deal => deal.type === type);
    } catch (error) {
      Logger.error(`Error getting ${type} deals:`, error);
      return [];
    }
  }

  static async deleteDeal(id: string): Promise<boolean> {
    try {
      Logger.info(`Deleting deal with ID: ${id}`);
      const response = await fetch(`${API_URL}/api/deals/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete deal: ${response.status}`);
      }
      
      Logger.info('Deal deleted successfully');
      return true;
    } catch (error) {
      Logger.error('Error deleting deal from API:', error);
      
      // Fallback to localStorage if API fails
      try {
        const deals = await this.getAllDealsFromLocalStorage();
        const filteredDeals = deals.filter(deal => deal.id !== id);
        localStorage.setItem('savedDeals', JSON.stringify(filteredDeals));
        return true;
      } catch (localError) {
        Logger.error('Error deleting deal from localStorage:', localError);
        return false;
      }
    }
  }

  static async setCurrentDeal(deal: SavedDeal): Promise<void> {
    try {
      localStorage.setItem('currentDeal', JSON.stringify(deal));
    } catch (error) {
      Logger.error('Error setting current deal:', error);
    }
  }

  static async getCurrentDeal(): Promise<SavedDeal | null> {
    try {
      const dealStr = localStorage.getItem('currentDeal');
      return dealStr ? JSON.parse(dealStr) : null;
    } catch (error) {
      Logger.error('Error getting current deal:', error);
      return null;
    }
  }

  static async clearCurrentDeal(): Promise<void> {
    try {
      localStorage.removeItem('currentDeal');
    } catch (error) {
      Logger.error('Error clearing current deal:', error);
    }
  }
  
  // Helper method to map backend deal format to frontend format
  private static mapDealFromBackend(backendDeal: BackendDeal): SavedDeal | null {
    if (!backendDeal) return null;
    
    // Extract MongoDB ID - ensure it's a string
    const dealId = backendDeal._id || backendDeal.id || `generated-${Date.now()}`;
    
    // For debugging
    Logger.info(`Mapping backend deal to frontend: ID=${dealId}, Name=${backendDeal.propertyName}`);
    
    // Create the data property based on property type
    let dealData: Partial<SFRDealData | MultiFamilyDealData> = {
      id: dealId,
      propertyName: backendDeal.propertyName || 'Untitled Property',
      propertyType: backendDeal.propertyType,
      propertyAddress: backendDeal.propertyAddress,
      purchasePrice: Number(backendDeal.purchasePrice) || 0,
      downPayment: Number(backendDeal.downPayment) || 0,
      interestRate: Number(backendDeal.interestRate) || 0,
      loanTerm: Number(backendDeal.loanTerm) || 30,
      propertyTaxRate: Number(backendDeal.propertyTaxRate) || 0,
      insuranceRate: Number(backendDeal.insuranceRate) || 0,
      yearBuilt: Number(backendDeal.yearBuilt) || 0,
      propertyManagementRate: Number(backendDeal.propertyManagementRate) || 0,
    };
    
    // Add type-specific fields
    if (backendDeal.propertyType === 'SFR') {
      dealData = {
        ...dealData,
        propertyType: 'SFR', // Required to satisfy type checking
        monthlyRent: Number(backendDeal.monthlyRent) || 0,
        squareFootage: Number(backendDeal.squareFootage) || 0,
        bedrooms: Number(backendDeal.bedrooms) || 0,
        bathrooms: Number(backendDeal.bathrooms) || 0,
        maintenanceCost: Number(backendDeal.maintenanceCost) || 0,
        // Handle long-term assumptions with a default
        longTermAssumptions: (backendDeal.longTermAssumptions as LongTermAssumptions) || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2,
          vacancyRate: 5
        }
      };
    } else if (backendDeal.propertyType === 'MF') {
      dealData = {
        ...dealData,
        propertyType: 'MF', // Required to satisfy type checking
        totalUnits: Number(backendDeal.totalUnits) || 0,
        totalSqft: Number(backendDeal.totalSqft) || 0,
        maintenanceCostPerUnit: Number(backendDeal.maintenanceCostPerUnit) || 0,
        unitTypes: (backendDeal.unitTypes as MultiFamilyDealData['unitTypes']) || [],
        commonAreaUtilities: (backendDeal.commonAreaUtilities as MultiFamilyDealData['commonAreaUtilities']) || {
          electric: 0,
          water: 0,
          gas: 0,
          trash: 0
        },
        // Handle long-term assumptions with a default
        longTermAssumptions: (backendDeal.longTermAssumptions as MultiFamilyDealData['longTermAssumptions']) || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2,
          vacancyRate: 5,
          capitalExpenditureRate: 3,
          commonAreaMaintenanceRate: 2
        }
      };
    }
    
    // If there's an analysis object, adapt it to the frontend format
    if (backendDeal.analysis) {
      Logger.info('Found analysis data in backend response');
      dealData.analysisResult = adaptAnalysisResponse(backendDeal.analysis);
    }
    
    // Convert date fields or use defaults
    const createdAt = typeof backendDeal.createdAt === 'string' 
      ? backendDeal.createdAt 
      : new Date().toISOString();
    
    const updatedAt = typeof backendDeal.updatedAt === 'string'
      ? backendDeal.updatedAt
      : new Date().toISOString();
    
    return {
      id: dealId,
      name: backendDeal.propertyName || 'Untitled Deal',
      type: backendDeal.propertyType || 'SFR',
      data: dealData as SavedDeal['data'], // Cast to the correct type
      savedAt: createdAt,
      lastModified: updatedAt
    };
  }
} 