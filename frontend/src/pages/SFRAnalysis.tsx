import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Snackbar,
  ButtonGroup,
  Container,
  Stack,
  Fade,
  Link
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { AutoAwesome, Edit, DataUsage as SampleDataIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import SFRPropertyForm from '../components/SFRAnalysis/SFRPropertyForm';
import PropertyWizard from '../components/SFRAnalysis/PropertyWizard';
import { propertyApi } from '../services/api';
import { pipelineApi } from '../services/pipelineApi';
import type { SFRPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { SimplePortfolioSelector } from '../components/SFRAnalysis/SimplePortfolioSelector';
import { AppleCard, AppleButton } from '../components/ui/AppleComponents';
import { appleColors } from '../theme/appleDesignSystem';
import { SFR_PROPERTY_DEFAULTS, DEFAULT_ENHANCED_GOALS } from '../constants/sfrPropertyDefaults';

const SFRAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<'input' | 'results'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const [pipelineDealId, setPipelineDealId] = useState<string | null>(null); // Track Pipeline deal ID separately
  const [isAddingToPipeline, setIsAddingToPipeline] = useState(false);
  
  // Input method state
  const [inputMethod, setInputMethod] = useState<'wizard' | 'manual'>('wizard');
  
  // Phase 2: Interactive Analysis state
  const [, setIsRecalculating] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const wizardEnabled = true; // Enable for Phase 1 testing
  
  // Race condition prevention for main analysis
  const [activeAnalysisRequestId, setActiveAnalysisRequestId] = useState<string | null>(null);
  
  // Helper function to safely extract string ID from any response
  const extractStringId = (idValue: any): string => {
    if (!idValue) return '';
    
    // If it's already a string, return it
    if (typeof idValue === 'string') return idValue;
    
    // If it's an object with _id property (nested ObjectId)
    if (typeof idValue === 'object' && idValue._id) {
      return extractStringId(idValue._id);
    }
    
    // If it's an object with id property
    if (typeof idValue === 'object' && idValue.id) {
      return extractStringId(idValue.id);
    }
    
    // If it's an object with toString method (MongoDB ObjectId)
    if (typeof idValue === 'object' && typeof idValue.toString === 'function') {
      return idValue.toString();
    }
    
    // Fallback: convert to string
    return String(idValue);
  };
  
  // Portfolio context state
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);


  // Handle input method change
  const handleInputMethodChange = (method: 'wizard' | 'manual') => {
    setInputMethod(method);
    setError(null);
  };

  // Load sample data
  const loadSampleData = async () => {
    setSampleLoading(true);
    setError(null);
    
    console.log('Loading sample data...');
    try {
      const response = await propertyApi.getSampleSFR();
      
      console.log('Sample data response:', response);
      console.log('Sample data status:', response.status);
      console.log('Sample data received:', response.data);
      
      if (response.status === 200 && response.data) {
        console.log('Setting property data from sample data');
        setPropertyData(response.data as SFRPropertyData);
        setActiveSection('input'); // Switch to input section
      } else {
        console.error('Failed to load sample data:', response);
        setError('Failed to load sample data: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error loading sample data:', err);
      setError('Error loading sample data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSampleLoading(false);
    }
  };

  // Handle form submission
  const handleAnalyzeProperty = async (data: SFRPropertyData): Promise<Analysis | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending property data to API:', data);
      
      // Use traditional full analysis (includes market intelligence, tax estimation, etc.)
      console.log('Sending property data to full analysis API:', data);
      
      // Add portfolio context if selected
      const analysisData = {
        ...data,
        portfolioId: selectedPortfolioId || undefined // This enables portfolio-context analysis
      };
      
      let response;
      
      // CLEAN ARCHITECTURE: Always perform fresh analysis, then save appropriately
      console.log('🧮 Performing fresh analysis...');
      response = await propertyApi.analyzeProperty(analysisData);
      console.log('📊 FRESH ANALYSIS RESPONSE:', response.data);

      // If this was for an existing deal, update it with the fresh analysis
      if (dealId && response.status === 200 && response.data) {
        console.log('💾 Saving fresh analysis to existing deal:', dealId);
        try {
          const updateData = {
            ...analysisData,
            analysis: response.data,
            updatedAt: new Date()
          };
          await propertyApi.updateProperty(dealId, updateData);
          console.log('✅ Successfully updated existing deal with fresh analysis');

          // Include dealId in response so frontend knows which deal was updated
          response.data._id = dealId;
          response.data.dealId = dealId;
        } catch (updateError) {
          console.warn('⚠️ Fresh analysis succeeded but failed to update existing deal:', updateError);
          // Continue - user still gets fresh analysis results
        }
      } else if (pipelineDealId) {
        // Check if pipeline deal already has linked analysis to avoid duplicates
        console.log('🔍 Checking if pipeline deal already has analysis:', pipelineDealId);
        try {
          const pipelineResponse = await pipelineApi.getDealById(pipelineDealId);
          if (pipelineResponse?.analysisId) {
            // Convert MongoDB ObjectId to string if needed
            console.log('🔍 pipelineResponse.analysisId type:', typeof pipelineResponse.analysisId, 'value:', pipelineResponse.analysisId);
            
            let analysisId: string;
            if (typeof pipelineResponse.analysisId === 'object' && pipelineResponse.analysisId !== null) {
              // Handle MongoDB ObjectId which might be an object with _id
              const idObj = pipelineResponse.analysisId as any;
              analysisId = idObj._id?.toString() || idObj.id?.toString() || idObj.toString();
            } else {
              analysisId = String(pipelineResponse.analysisId);
            }
            
            console.log('⚠️ Pipeline deal already has analysis, updating existing:', analysisId, 'type:', typeof analysisId);
            // Update the existing analysis instead of creating new one
            const cleanDealId = extractStringId(analysisId);
            setDealId(cleanDealId);
            response = await propertyApi.updateProperty(cleanDealId, analysisData);
            console.log('📊 PIPELINE UPDATE API RESPONSE:', response.data);
          } else {
            // Pipeline deal has no analysis yet, create new one
            console.log('✨ Creating new analysis for pipeline deal');
            response = await propertyApi.analyzeProperty(analysisData);
            console.log('📊 PIPELINE CREATE API RESPONSE:', response.data);
          }
        } catch (error) {
          console.warn('Could not check pipeline deal status, creating new analysis');
          response = await propertyApi.analyzeProperty(analysisData);
          console.log('📊 FALLBACK CREATE API RESPONSE:', response.data);
        }
      } else {
        // Creating completely new analysis
        console.log('✨ Creating new analysis');
        response = await propertyApi.analyzeProperty(analysisData);
        console.log('📊 CREATE API RESPONSE:', response.data);
      }
      
      if (response.status === 200 && response.data) {
        console.log('Analysis successful:', response.data);
        
        // CRITICAL DEBUG: Check investmentDecision structure for hero card issue
        console.log('🎯 HERO CARD DEBUG - investmentDecision check:', {
          hasInvestmentDecision: !!response.data.investmentDecision,
          investmentDecisionKeys: response.data.investmentDecision ? Object.keys(response.data.investmentDecision) : 'MISSING',
          dealQuality: response.data.investmentDecision?.dealQuality || 'MISSING',
          verdict: response.data.investmentDecision?.verdict || 'MISSING'
        });
        
        // Debug: Check if portfolio context is in the response
        console.log('🔍 ANALYSIS RESPONSE - Portfolio context check:', {
          hasInvestmentDecision: !!response.data.investmentDecision,
          hasPortfolioContext: !!response.data.investmentDecision?.portfolioContext,
          portfolioContext: response.data.investmentDecision?.portfolioContext
        });
        
        // REMOVED AUTO-SAVE: Don't automatically save property to portfolio
        // This allows investors to compare the same property against multiple portfolios
        // before deciding which one (if any) to save it to
        
        console.log('Analysis completed successfully. Property NOT auto-saved.');
        console.log('User can now view portfolio impacts and choose to save explicitly.');
        
        // Set data and show results (using traditional analysis format)
        setPropertyData(data);
        
        // CRITICAL FIX: Handle different response structures from UPDATE vs CREATE endpoints
        // UPDATE endpoint returns: { analysis: {...}, propertyData: {...} }
        // CREATE endpoint returns: { monthlyAnalysis: {...}, keyMetrics: {...} } (analysis at root)
        const analysisData = response.data.analysis || response.data;
        console.log('🔧 ANALYSIS DATA EXTRACTED:', {
          hasNestedAnalysis: !!response.data.analysis,
          extractedAnalysisKeys: Object.keys(analysisData),
          hasKeyMetrics: !!analysisData.keyMetrics,
          hasInvestmentDecision: !!analysisData.investmentDecision
        });
        setAnalysis(analysisData);
        
        // Debug: Verify portfolio context is in state after setting
        console.log('🔍 STATE AFTER SET - Portfolio context check:', {
          hasInvestmentDecision: !!response.data.investmentDecision,
          hasPortfolioContext: !!response.data.investmentDecision?.portfolioContext,
          portfolioContextInResponse: response.data.investmentDecision?.portfolioContext
        });
        
        setActiveSection('results'); // Switch to results section
        return response.data;
      } else {
        console.error('API response error:', response);
        setError('Analysis failed: ' + (response.message || 'Unknown error'));
        return null;
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      setError('Error during analysis: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load deal data from URL parameters
  useEffect(() => {
    console.log('📍 SFRAnalysis useEffect triggered');
    console.log('🔍 Checking sessionStorage for pipelineDealData...');
    
    const id = searchParams.get('id');
    console.log('URL id parameter:', id);
    
    if (id) {
      console.log('Loading existing deal with ID:', id);
      const cleanId = extractStringId(id);
      setDealId(cleanId);
      loadDealData(cleanId);
    } else {
      // Check for pipeline deal data in sessionStorage
      const pipelineDealData = sessionStorage.getItem('pipelineDealData');
      console.log('sessionStorage pipelineDealData:', pipelineDealData);
      
      if (pipelineDealData) {
        try {
          const data = JSON.parse(pipelineDealData);
          console.log('🎯 Found and parsed pipeline deal data:', data);
          
          // Pre-populate the form with pipeline data (only for new analysis)
          const prefilledData: Partial<SFRPropertyData> = {
            purchasePrice: data.purchasePrice,
            monthlyRent: data.monthlyRent || 0,
            propertyAddress: {
              street: data.propertyAddress.street,
              city: data.propertyAddress.city,
              state: data.propertyAddress.state,
              zipCode: data.propertyAddress.zipCode
            },
            downPayment: data.downPayment || (data.purchasePrice * 0.25),
            loanTerm: data.loanTermYears || SFR_PROPERTY_DEFAULTS.loanTerm,
            interestRate: data.interestRate || SFR_PROPERTY_DEFAULTS.interestRate,
            // Map monthly expenses to maintenance cost (approximate)
            maintenanceCost: data.monthlyExpenses || 0,
            // Property details from pipeline
            squareFootage: data.propertyDetails?.squareFootage || SFR_PROPERTY_DEFAULTS.squareFootage,
            bedrooms: data.propertyDetails?.bedrooms || SFR_PROPERTY_DEFAULTS.bedrooms,
            bathrooms: data.propertyDetails?.bathrooms || SFR_PROPERTY_DEFAULTS.bathrooms,
            yearBuilt: data.propertyDetails?.yearBuilt || SFR_PROPERTY_DEFAULTS.yearBuilt,
            // Use centralized default rates for consistency
            propertyTaxRate: SFR_PROPERTY_DEFAULTS.propertyTaxRate,
            insuranceRate: SFR_PROPERTY_DEFAULTS.insuranceRate,
            propertyManagementRate: SFR_PROPERTY_DEFAULTS.propertyManagementRate,
            propertyName: `${data.propertyAddress.street} - ${data.propertyAddress.city}`,
            // Use centralized long term assumptions for consistency
            longTermAssumptions: {
              ...SFR_PROPERTY_DEFAULTS.longTermAssumptions
            },
            // Preserve enhanced goals if they exist in the pipeline data, otherwise use defaults
            enhancedGoals: data.enhancedGoals || {
              ...DEFAULT_ENHANCED_GOALS,
              freeTextStrategy: data.strategyNotes || ''
            }
          };
          
          console.log('📝 Setting pre-filled data:', prefilledData);
          setPropertyData(prefilledData as SFRPropertyData);
          console.log('✅ PropertyData state updated');
          setPipelineDealId(data.dealId); // Track the pipeline deal ID separately
          
          // Don't clear session storage immediately - let's keep it for debugging
          console.log('🗑️ Clearing sessionStorage after successful pre-fill');
          sessionStorage.removeItem('pipelineDealData');
          
            // Show a message to the user
          setSuccessMessage('Property data pre-filled from pipeline. Please complete the remaining fields for full analysis.');
          console.log('🎉 Pre-population complete!');
          
        } catch (error) {
          console.error('❌ Error parsing pipeline deal data:', error);
        }
      } else {
        console.log('❌ No pipelineDealData found in sessionStorage');
      }
    }
  }, [location.search]);

  // Debug useEffect to monitor propertyData changes
  useEffect(() => {
    console.log('🔄 PropertyData state changed:', propertyData);
    if (propertyData?.propertyAddress) {
      console.log('📍 Address in state:', propertyData.propertyAddress);
    }
  }, [propertyData]);

  // Load deal data from API
  const loadDealData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading deal data for ID:', id, 'type:', typeof id);
      const response = await propertyApi.getProperty(id);
      
      if (response.status === 200 && response.data) {
        console.log('Deal data loaded:', response.data);
        
        // Extract property data without analysis
        const { analysis: dealAnalysis, ...dealPropertyData } = response.data;
        
        // Make sure property type is correct
        if (dealPropertyData.propertyType !== 'SFR') {
          console.error('Property type mismatch:', dealPropertyData.propertyType);
          setError('This is not a Single-Family Property');
          setIsLoading(false);
          return;
        }

        // Set property data
        setPropertyData(dealPropertyData as SFRPropertyData);

        // If analysis data exists, validate completeness before using
        if (dealAnalysis) {
          console.log('Setting analysis data:', dealAnalysis);

          // Log analysis structure for debugging
          const structureCheck = {
            hasMonthlyExpenses: !!dealAnalysis.monthlyAnalysis?.expenses,
            hasPropertyTax: !!dealAnalysis.monthlyAnalysis?.expenses?.propertyTax,
            hasAnnualAnalysis: !!dealAnalysis.annualAnalysis,
            hasLongTermAnalysis: !!dealAnalysis.longTermAnalysis,
            hasKeyMetrics: !!dealAnalysis.keyMetrics,
            hasInvestmentDecision: !!dealAnalysis.investmentDecision,
            hasPortfolioContext: !!dealAnalysis.investmentDecision?.portfolioContext,
            portfolioContext: dealAnalysis.investmentDecision?.portfolioContext,
            // TAX INTELLIGENCE LOAD DEBUGGING
            hasTaxAnalysis: !!dealAnalysis.investmentDecision?.taxAnalysis,
            taxAnalysisKeys: dealAnalysis.investmentDecision?.taxAnalysis ? Object.keys(dealAnalysis.investmentDecision.taxAnalysis) : [],
            optimalHoldPeriod: dealAnalysis.investmentDecision?.taxAnalysis?.optimalHoldPeriod,
            taxSavings: dealAnalysis.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal
          };
          console.log('Analysis structure check:', structureCheck);
          
          // Check if analysis data is complete (has the critical components)
          const isAnalysisComplete = dealAnalysis.keyMetrics && 
                                   dealAnalysis.monthlyAnalysis && 
                                   dealAnalysis.longTermAnalysis && 
                                   dealAnalysis.investmentDecision;
          
          if (isAnalysisComplete) {
            setAnalysis(dealAnalysis);

            // TAX INTELLIGENCE STATE VERIFICATION
            console.log('🔍 TAX LOAD VERIFY - Analysis set in state:', {
              dealId: id,
              hasTaxAnalysis: !!dealAnalysis.investmentDecision?.taxAnalysis,
              optimalHoldPeriod: dealAnalysis.investmentDecision?.taxAnalysis?.optimalHoldPeriod,
              taxSavings: dealAnalysis.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal,
              willShowTaxTab: !!dealAnalysis.investmentDecision?.taxAnalysis
            });
            setActiveSection('results'); // Switch to results section
          } else {
            console.warn('🔍 Analysis data is incomplete, user will need to re-analyze');
            console.warn('Missing components:', {
              keyMetrics: !dealAnalysis.keyMetrics,
              monthlyAnalysis: !dealAnalysis.monthlyAnalysis,
              longTermAnalysis: !dealAnalysis.longTermAnalysis,
              investmentDecision: !dealAnalysis.investmentDecision
            });
            // Stay on input tab so user can re-analyze
            setActiveSection('input');
            setError('This property has incomplete analysis data. Please re-analyze to see results.');
          }
        }
      } else {
        console.error('Failed to load deal data:', response);
        setError('Failed to load deal data: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error loading deal data:', err);
      setError('Error loading deal data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving the deal
  const handleSaveDeal = async () => {
    if (!propertyData || !analysis) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Prepare the deal data with analysis
      const dealData = {
        ...propertyData,
        analysis
      };
      
      // Debug: Check if portfolio context and tax analysis are being saved
      console.log('🔍 SAVE DEBUG - Investment Decision data check:', {
        hasAnalysis: !!analysis,
        hasInvestmentDecision: !!analysis?.investmentDecision,
        hasPortfolioContext: !!analysis?.investmentDecision?.portfolioContext,
        portfolioContext: analysis?.investmentDecision?.portfolioContext
      });
      
      let response;
      
      if (dealId) {
        // Update existing deal - dealId should already be a string from state
        console.log('💾 CRITICAL DEBUG - dealId details:', {
          dealId: dealId,
          dealIdType: typeof dealId,
          dealIdString: String(dealId),
          dealIdJSON: JSON.stringify(dealId),
          isObject: typeof dealId === 'object'
        });
        
        // Force string conversion as safety net
        const cleanDealId = extractStringId(dealId);
        console.log('💾 Using cleaned ID for update:', cleanDealId, 'type:', typeof cleanDealId);
        
        response = await propertyApi.updateProperty(cleanDealId, dealData);
      } else {
        // Create new deal
        console.log('Saving new deal to database:', dealData);
        response = await propertyApi.saveProperty(dealData);
      }
      
      if ((response.status === 201 || response.status === 200) && response.data) {
        console.log('Deal saved successfully:', response.data);

        // TAX INTELLIGENCE POST-SAVE VERIFICATION
        console.log('🔍 TAX SAVE VERIFY - Check saved deal contains tax analysis:', {
          hasTaxAnalysis: !!response.data.analysis?.investmentDecision?.taxAnalysis,
          optimalHoldPeriod: response.data.analysis?.investmentDecision?.taxAnalysis?.optimalHoldPeriod,
          taxSavings: response.data.analysis?.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal,
          savedDealId: response.data._id
        });
        
        // If this deal came from Pipeline, link the analysis back to the Pipeline deal
        if (pipelineDealId && response.data._id) {
          const cleanAnalysisId = extractStringId(response.data._id);
          console.log('🔗 Linking analysis back to Pipeline deal:', {
            pipelineDealId,
            analysisId: cleanAnalysisId
          });
          
          try {
            // Call Pipeline API to link the analysis
            const linkResponse = await fetch(`/api/pipeline/deals/${pipelineDealId}/link-analysis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                analysisId: cleanAnalysisId
              })
            });
            
            if (linkResponse.ok) {
              console.log('✅ Successfully linked analysis to Pipeline deal');
              setSuccessMessage('Deal saved and linked to Pipeline successfully!');
            } else {
              console.warn('⚠️ Failed to link analysis to Pipeline deal:', linkResponse.status);
              setSuccessMessage(dealId ? 'Deal updated successfully!' : 'Deal saved successfully!');
            }
          } catch (linkError) {
            console.error('❌ Error linking analysis to Pipeline deal:', linkError);
            setSuccessMessage(dealId ? 'Deal updated successfully!' : 'Deal saved successfully!');
          }
        } else {
          setSuccessMessage(dealId ? 'Deal updated successfully!' : 'Deal saved successfully!');
        }
        
        // Set flag to refresh Pipeline data when user navigates back
        if (dealId || pipelineDealId) {
          console.log('🏷️ Setting flag for Pipeline refresh after deal save');
          sessionStorage.setItem('returnedFromSFRAnalysis', 'true');
        }
        
        // If this was a new deal, update the URL with the new ID
        if (!dealId && response.data._id) {
          // CRITICAL: Use helper to ensure proper ID extraction
          const newDealId = extractStringId(response.data._id);
          setDealId(newDealId);
          navigate(`/sfr-analysis?id=${newDealId}`, { replace: true });
        }
      } else {
        console.error('Failed to save deal:', response);
        setError('Failed to save deal: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving deal:', err);
      setError('Error saving deal: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding existing deal to Pipeline
  const handleAddToPipeline = async () => {
    if (!dealId || !analysis || !propertyData) {
      setError('No deal data to add to Pipeline');
      return;
    }
    
    setIsAddingToPipeline(true);
    setError(null);
    
    try {
      console.log('Adding existing deal to Pipeline:', dealId);
      
      const result = await pipelineApi.convertAnalysisToPipeline(
        dealId,
        {
          channel: 'OTHER', // Default source for converted deals
          contact: 'Imported from Analysis',
          notes: 'Converted from existing SFR analysis'
        },
        `Imported from analyzed deal: ${propertyData.propertyName || propertyData.propertyAddress?.street || 'Unknown Property'}`
      );
      
      console.log('Successfully added deal to Pipeline:', result);
      setSuccessMessage('Deal successfully added to Pipeline! You can now manage it in your deal flow.');
      
      // Optionally navigate to Pipeline page after a delay
      setTimeout(() => {
        if (confirm('Would you like to go to the Pipeline to see your newly added deal?')) {
          navigate('/pipeline');
        }
      }, 2000);
    } catch (err) {
      console.error('Error adding deal to Pipeline:', err);
      setError('Error adding deal to Pipeline: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsAddingToPipeline(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccessMessage(null);
  };

  // Phase 2: Interactive Analysis Handlers
  
  // Dedicated Apply Changes handler - complete UI lockdown and reload
  const handleApplyChanges = useCallback(async (updatedData: SFRPropertyData) => {
    console.log('🚀 APPLY CHANGES: Starting complete analysis reload');
    
    // 1. Lock the entire UI
    setIsApplyingChanges(true);
    setIsRecalculating(true);
    setError(null);
    
    // 2. Cancel any pending operations
    if (activeAnalysisRequestId) {
      console.log('🚀 APPLY CHANGES: Cancelling any pending analysis');
      setActiveAnalysisRequestId(null);
    }
    
    try {
      console.log('🚀 APPLY CHANGES: Calling full analysis API with updated data:', updatedData);
      
      // 3. Call the full analysis API (same as initial analysis)
      const response = await propertyApi.analyzeProperty(updatedData);
      
      if (response.status === 200 && response.data) {
        console.log('🚀 APPLY CHANGES: API success, completely refreshing state');
        
        console.log('🚀 APPLY CHANGES: New cash flow:', response.data?.monthlyAnalysis?.cashFlow);
        console.log('🚀 APPLY CHANGES: New cap rate:', response.data?.keyMetrics?.capRate);
        
        // 4. Completely refresh all state (force re-render of all components)
        setPropertyData(updatedData);
        setAnalysis(response.data);
        
        // 5. Force all components to recognize the new data
        console.log('🚀 APPLY CHANGES: State updated successfully');
        
      } else {
        console.error('🚀 APPLY CHANGES: API failed:', response);
        setError('Failed to apply changes: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('🚀 APPLY CHANGES: Error:', err);
      setError('Error applying changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // 6. Unlock the UI
      setIsApplyingChanges(false);
      setIsRecalculating(false);
      console.log('🚀 APPLY CHANGES: Complete - UI unlocked');
    }
  }, [activeAnalysisRequestId]);
  
  // Handle parameter changes with race condition prevention
  const handleParameterChange = useCallback(async (updatedData: SFRPropertyData) => {
    // Check if this is an Apply Changes call (special flag)
    if ((updatedData as any).__applyChangesMode) {
      console.log('🚀 ROUTING: Apply Changes detected, routing to dedicated handler');
      delete (updatedData as any).__applyChangesMode;
      return handleApplyChanges(updatedData);
    }
    
    // Generate unique request ID for this analysis
    const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    setIsRecalculating(true);
    setError(null);
    
    // Set active request ID
    setActiveAnalysisRequestId(requestId);
    
    try {
      console.log(`Starting full analysis (${requestId.substring(requestId.length - 4)}) with new parameters:`, updatedData);
      const response = await propertyApi.analyzeProperty(updatedData);
      
      // Use callback to check latest active request ID to avoid stale closures
      setActiveAnalysisRequestId(currentActiveId => {
        if (requestId === currentActiveId && response.status === 200 && response.data) {
          console.log(`SFRAnalysis: About to update state with new data:`);
          
          console.log(`SFRAnalysis: - Old analysis cash flow: ${analysis?.monthlyAnalysis?.cashFlow}`);
          console.log(`SFRAnalysis: - New analysis cash flow: ${response.data?.monthlyAnalysis?.cashFlow}`);
          console.log(`SFRAnalysis: - Updated property data:`, updatedData);
          setPropertyData(updatedData);
          setAnalysis(response.data);
          setIsRecalculating(false);
          console.log(`Full analysis (${requestId.substring(requestId.length - 4)}) completed successfully`);
        } else if (requestId !== currentActiveId) {
          console.log(`Full analysis (${requestId.substring(requestId.length - 4)}) cancelled - newer request active`);
        } else {
          console.error('Parameter update failed:', response);
          setError('Failed to update analysis: ' + (response.message || 'Unknown error'));
          setIsRecalculating(false);
        }
        return currentActiveId; // Don't actually change the activeRequestId here
      });
      
      // Backup timeout to ensure loading state clears
      setTimeout(() => {
        setActiveAnalysisRequestId(currentActiveId => {
          if (requestId === currentActiveId) {
            setIsRecalculating(false);
          }
          return currentActiveId;
        });
      }, 0);
      
    } catch (err) {
      console.error(`Error updating parameters (${requestId.substring(requestId.length - 4)}):`, err);
      setError('Error updating analysis: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsRecalculating(false);
    }
  }, [handleApplyChanges]);

  // Handle applying deal fixes - use full analysis for complete data consistency
  const handleApplyFix = useCallback(async (updatedData: SFRPropertyData, fixDescription: string) => {
    console.log('🚀 DEAL OPTIMIZER: Starting complete analysis reload');
    
    // 1. Lock the entire UI (same as Interactive Analysis)
    setIsApplyingChanges(true);
    setIsRecalculating(true);
    setError(null);
    
    // 2. Cancel any pending operations
    if (activeAnalysisRequestId) {
      console.log('🚀 DEAL OPTIMIZER: Cancelling any pending analysis');
      setActiveAnalysisRequestId(null);
    }
    
    try {
      console.log('🚀 DEAL OPTIMIZER: Applying fixes with full analysis:', fixDescription);
      console.log('🚀 DEAL OPTIMIZER: Updated data:', updatedData);
      
      // 3. Use full analysis to ensure data consistency across all tabs
      const response = await propertyApi.analyzeProperty(updatedData);
      
      if (response.status === 200 && response.data) {
        console.log('🚀 DEAL OPTIMIZER: API success, completely refreshing state');
        
        console.log('🚀 DEAL OPTIMIZER: New cash flow:', response.data?.monthlyAnalysis?.cashFlow);
        console.log('🚀 DEAL OPTIMIZER: New cap rate:', response.data?.keyMetrics?.capRate);
        
        // 4. Completely refresh all state (force re-render of all components)
        setPropertyData(updatedData);
        setAnalysis(response.data);
        setSuccessMessage(`Applied fix: ${fixDescription}`);
        
        console.log('🚀 DEAL OPTIMIZER: Deal fix applied successfully');
      } else {
        console.error('🚀 DEAL OPTIMIZER: Deal fix failed:', response);
        setError('Failed to apply fix: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('🚀 DEAL OPTIMIZER: Error applying fix:', err);
      setError('Error applying fix: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // 5. Unlock the UI
      setIsApplyingChanges(false);
      setIsRecalculating(false);
      console.log('🚀 DEAL OPTIMIZER: Complete - UI unlocked');
    }
  }, [activeAnalysisRequestId]);

  // Handle loading scenarios with preserved analysis data
  const handleLoadScenario = useCallback(async (scenarioData: SFRPropertyData, savedAnalysis?: Analysis) => {
    setIsRecalculating(true);
    setError(null);
    
    try {
      console.log('Loading scenario:', {
        scenarioName: scenarioData.propertyName || 'Unnamed',
        hasSavedAnalysis: !!savedAnalysis,
        savedCashFlow: savedAnalysis?.monthlyAnalysis?.cashFlow
      });
      
      if (savedAnalysis) {
        // Load scenario with saved analysis data (no recalculation needed)
        setPropertyData(scenarioData);
        setAnalysis(savedAnalysis);
        setSuccessMessage('Scenario loaded successfully (using saved analysis)');
        console.log('Scenario loaded from saved analysis - no recalculation needed');
      } else {
        // Fallback: recalculate analysis if no saved data available
        console.log('No saved analysis found, recalculating...');
        const response = await propertyApi.analyzeProperty(scenarioData);
        
        if (response.status === 200 && response.data) {
          setPropertyData(scenarioData);
          setAnalysis(response.data);
          setSuccessMessage('Scenario loaded successfully (recalculated)');
          console.log('Scenario loaded with fresh analysis');
        } else {
          console.error('Scenario load failed:', response);
          setError('Failed to load scenario: ' + (response.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Error loading scenario:', err);
      setError('Error loading scenario: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsRecalculating(false);
    }
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <AppleCard padding="large">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3}>
              <Box sx={{ flex: 1 }}>
                {/* Dynamic Title: Property Address when analysis exists, generic when input */}
                {activeSection === 'results' && propertyData?.propertyAddress ? (
                  <>
                    <Typography 
                      variant="h4" 
                      component="h1"
                      sx={{ 
                        fontWeight: 700,
                        color: appleColors.gray[900],
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      📍 {propertyData.propertyAddress.street}, {propertyData.propertyAddress.city}, {propertyData.propertyAddress.state} {propertyData.propertyAddress.zipCode}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1 }}>
                      {propertyData.bedrooms && propertyData.bathrooms && (
                        <Typography variant="body1" sx={{ color: appleColors.gray[700], fontWeight: 500 }}>
                          {propertyData.bedrooms} bed • {propertyData.bathrooms} bath
                        </Typography>
                      )}
                      {propertyData.squareFootage && (
                        <Typography variant="body1" sx={{ color: appleColors.gray[700], fontWeight: 500 }}>
                          • {propertyData.squareFootage.toLocaleString()} sqft
                        </Typography>
                      )}
                      {propertyData.yearBuilt && (
                        <Typography variant="body1" sx={{ color: appleColors.gray[700], fontWeight: 500 }}>
                          • Built {propertyData.yearBuilt}
                        </Typography>
                      )}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: appleColors.blue[600],
                        fontWeight: 600
                      }}
                    >
                      ${propertyData.purchasePrice?.toLocaleString()}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography 
                      variant="h4" 
                      component="h1"
                      sx={{ 
                        fontWeight: 700,
                        color: appleColors.gray[900],
                        mb: 1
                      }}
                    >
                      Single-Family Rental Analysis
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: appleColors.gray[600],
                        maxWidth: '600px',
                        lineHeight: 1.6
                      }}
                    >
                      Analyze your single family rental investment with comprehensive market intelligence, 
                      AI-powered insights, and detailed financial projections.
                    </Typography>
                  </>
                )}
              </Box>
              
              {/* Context-Aware Action Buttons */}
              <Stack direction="row" spacing={2}>
                {activeSection === 'results' ? (
                  <>
                    {/* Save Deal Button for Results */}
                    <AppleButton
                      variant="primary"
                      onClick={handleSaveDeal}
                      disabled={isSaving}
                      icon={<SaveIcon />}
                    >
                      {isSaving ? 'Saving...' : dealId ? 'Update Deal' : 'Save Deal'}
                    </AppleButton>
                    {/* Edit Property Button */}
                    <AppleButton
                      variant="secondary"
                      onClick={() => setActiveSection('input')}
                      icon={<Edit />}
                    >
                      Edit Property
                    </AppleButton>
                    
                    {/* Add to Pipeline Button - Only show for existing saved deals */}
                    {dealId && !pipelineDealId && (
                      <AppleButton
                        variant="secondary"
                        onClick={handleAddToPipeline}
                        disabled={isAddingToPipeline}
                        icon={<AddIcon />}
                      >
                        {isAddingToPipeline ? 'Adding...' : 'Add to Pipeline'}
                      </AppleButton>
                    )}
                  </>
                ) : (
                  <>
                    {/* Load Sample Button - Only show during development/testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <AppleButton
                        variant="secondary"
                        onClick={loadSampleData}
                        disabled={sampleLoading}
                        icon={<SampleDataIcon />}
                      >
                        {sampleLoading ? 'Loading...' : 'Load Sample'}
                      </AppleButton>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
          </AppleCard>
        </Box>
        
        {/* Navigation Pills */}
        <Box sx={{ mb: 4 }}>
          <AppleCard padding="medium">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
              <ButtonGroup 
                variant="outlined" 
                sx={{ 
                  '& .MuiButtonGroup-grouped': {
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5,
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: '140px',
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    }
                  }
                }}
              >
                <Button
                  onClick={() => setActiveSection('input')}
                  disabled={isApplyingChanges}
                  sx={{
                    backgroundColor: activeSection === 'input' ? appleColors.primary[50] : 'transparent',
                    borderColor: activeSection === 'input' ? appleColors.primary[500] : appleColors.gray[300],
                    color: activeSection === 'input' ? appleColors.primary[700] : appleColors.gray[700],
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    }
                  }}
                >
                  Property Input
                </Button>
                <Button
                  onClick={() => setActiveSection('results')}
                  disabled={!analysis || isApplyingChanges}
                  sx={{
                    backgroundColor: activeSection === 'results' ? appleColors.primary[50] : 'transparent',
                    borderColor: activeSection === 'results' ? appleColors.primary[500] : appleColors.gray[300],
                    color: activeSection === 'results' ? appleColors.primary[700] : appleColors.gray[700],
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    },
                    '&:disabled': {
                      backgroundColor: appleColors.gray[50],
                      borderColor: appleColors.gray[200],
                      color: appleColors.gray[400]
                    }
                  }}
                >
                  Analysis Results
                </Button>
              </ButtonGroup>
            </Stack>
          </AppleCard>
        </Box>
        
        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '16px',
              backgroundColor: '#FEF2F2',
              border: `1px solid #FECACA`,
              '& .MuiAlert-icon': {
                color: '#DC2626'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* Property Input Section */}
        <Fade in={activeSection === 'input'} unmountOnExit>
          <Box sx={{ display: activeSection === 'input' ? 'block' : 'none' }}>
            {/* FIX Issue #26 (FINAL): Clean UX - Wizard shows immediately, manual form link at bottom */}

            {/* Render Wizard or Form */}
            <Fade in={inputMethod === 'wizard'} unmountOnExit>
              <Box sx={{ display: inputMethod === 'wizard' ? 'block' : 'none' }}>
                {inputMethod === 'wizard' && wizardEnabled && (
                  <>
                    <PropertyWizard
                      key={propertyData?.propertyName || 'wizard-default'}
                      onComplete={handleAnalyzeProperty}
                      initialData={propertyData || undefined}
                      onCancel={() => handleInputMethodChange('manual')}
                      selectedPortfolioId={selectedPortfolioId}
                      onPortfolioChange={setSelectedPortfolioId}
                    />

                    {/* Manual form link at bottom - subtle, non-intrusive */}
                    <Box sx={{ textAlign: 'center', mt: 4, pb: 3, borderTop: `1px solid ${appleColors.gray[200]}`, pt: 3 }}>
                      <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                        Experienced investor?{' '}
                        <Link
                          component="button"
                          onClick={() => handleInputMethodChange('manual')}
                          sx={{
                            color: appleColors.primary[600],
                            fontWeight: 500,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: appleColors.primary[700]
                            }
                          }}
                        >
                          Use advanced manual form
                        </Link>
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Fade>

            <Fade in={inputMethod === 'manual'} unmountOnExit>
              <Box sx={{ display: inputMethod === 'manual' ? 'block' : 'none' }}>
                {inputMethod === 'manual' && (
                  <>
                    <SFRPropertyForm
                      key={propertyData?.propertyName || 'form-default'}
                      onSubmit={handleAnalyzeProperty}
                      initialData={propertyData || undefined}
                      isLoading={isLoading}
                      error={error || undefined}
                    />

                    {/* Wizard link at bottom when in manual mode */}
                    <Box sx={{ textAlign: 'center', mt: 4, pb: 3, borderTop: `1px solid ${appleColors.gray[200]}`, pt: 3 }}>
                      <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                        Prefer guided analysis?{' '}
                        <Link
                          component="button"
                          onClick={() => handleInputMethodChange('wizard')}
                          sx={{
                            color: appleColors.primary[600],
                            fontWeight: 500,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: appleColors.primary[700]
                            }
                          }}
                        >
                          Switch to Smart Wizard
                        </Link>
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Fade>
          </Box>
        </Fade>
        
        {/* Analysis Results Section */}
        <Fade in={activeSection === 'results'} unmountOnExit>
          <Box sx={{ display: activeSection === 'results' ? 'block' : 'none' }}>
            {analysis && propertyData && (
              <React.Fragment>
                {isLoading || isApplyingChanges ? (
                  <AppleCard padding="large">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                      <CircularProgress 
                        size={32} 
                        sx={{ 
                          color: appleColors.primary[500],
                          mr: 2
                        }} 
                      />
                      <Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: appleColors.gray[600],
                            fontWeight: 500
                          }}
                        >
                          {isApplyingChanges ? 'Applying changes and recalculating...' : 'Analyzing your property...'}
                        </Typography>
                        {activeAnalysisRequestId && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              color: appleColors.gray[500], 
                              fontFamily: 'monospace', 
                              fontSize: '10px',
                              display: 'block'
                            }}
                          >
                            Request ID: {activeAnalysisRequestId.substring(-6)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AppleCard>
                ) : (
                  <>
                    
                    <AnalysisResults 
                      analysis={analysis} 
                      propertyData={propertyData} 
                      dealId={dealId || undefined}
                      onParameterChange={handleParameterChange}
                      onApplyFix={handleApplyFix}
                      onLoadScenario={handleLoadScenario}
                      portfolioContext={(analysis as any)?.investmentDecision?.portfolioContext || (selectedPortfolioId ? {
                        portfolioId: selectedPortfolioId,
                        // These will be filled by backend data if available, otherwise placeholders
                        portfolioName: undefined,
                        portfolioGoal: undefined,
                        currentProperties: undefined,
                        monthlyNetCashFlow: undefined
                      } : undefined)}
                    />
                    
                    {/* Portfolio Selector */}
                    <Box sx={{ mt: 3 }}>
                      <SimplePortfolioSelector 
                        dealId={dealId || undefined}
                        selectedPortfolioId={selectedPortfolioId}
                        onPortfolioSelected={setSelectedPortfolioId}
                        disabled={activeSection === 'input' && !analysis}
                      />
                    </Box>
                  </>
                )}
              </React.Fragment>
            )}
          </Box>
        </Fade>
        
        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          message={successMessage}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: '#10B981',
              borderRadius: '12px',
              fontWeight: 500
            }
          }}
        />
      </Container>
  );
};

export default SFRAnalysis; 