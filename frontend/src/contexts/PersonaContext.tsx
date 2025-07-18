// Persona Context and Provider
// Created: July 15, 2025

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  UserPersona, 
  PERSONA_CONFIGS 
} from '../types/persona';
import type { 
  PersonaSpecificData, 
  PersonaPreferences, 
  UserExperience,
  PersonaConfig
} from '../types/persona';
import { PersonaDataTransformer } from '../services/PersonaDataTransformer';
import type { Analysis } from '../types/analysis';
import type { SFRPropertyData } from '../types/property';

interface PersonaContextType {
  // Current persona state
  persona: UserPersona;
  setPersona: (persona: UserPersona) => void;
  
  // Persona data and transformations
  personaData: PersonaSpecificData | null;
  transformData: (analysisData: Analysis, propertyData: SFRPropertyData) => PersonaSpecificData;
  
  // User preferences and experience
  preferences: PersonaPreferences;
  updatePreferences: (updates: Partial<PersonaPreferences>) => void;
  
  userExperience: UserExperience;
  updateUserExperience: (updates: Partial<UserExperience>) => void;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Persona configurations
  availablePersonas: typeof PERSONA_CONFIGS;
  
  // Analytics and tracking
  trackPersonaUsage: (action: string, metadata?: any) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

interface PersonaProviderProps {
  children: ReactNode;
  defaultPersona?: UserPersona;
}

export const PersonaProvider: React.FC<PersonaProviderProps> = ({ 
  children, 
  defaultPersona = UserPersona.EXPERIENCED 
}) => {
  const [persona, setPersonaState] = useState<UserPersona>(defaultPersona);
  const [personaData, setPersonaData] = useState<PersonaSpecificData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default preferences
  const [preferences, setPreferences] = useState<PersonaPreferences>({
    defaultPersona: defaultPersona,
    allowPersonaSwitching: true,
    rememberLastPersona: true,
    customizations: {
      [UserPersona.LEARNING]: {
        pinnedMetrics: [],
        hiddenSections: [],
        customTheme: {}
      },
      [UserPersona.EXPERIENCED]: {
        pinnedMetrics: [],
        hiddenSections: [],
        customTheme: {}
      },
      [UserPersona.DATA_ANALYST]: {
        pinnedMetrics: [],
        hiddenSections: [],
        customTheme: {}
      },
      [UserPersona.SPEED_SCANNER]: {
        pinnedMetrics: [],
        hiddenSections: [],
        customTheme: {}
      }
    },
    notifications: {
      riskAlerts: true,
      marketUpdates: true,
      educationalTips: true
    }
  });
  
  // Default user experience
  const [userExperience, setUserExperience] = useState<UserExperience>({
    yearsInvesting: 0,
    propertiesAnalyzed: 0,
    propertiesOwned: 0,
    preferredPropertyTypes: [],
    investmentGoals: [],
    riskTolerance: 'moderate',
    knowledgeAreas: {
      financialAnalysis: 50,
      marketAnalysis: 50,
      propertyManagement: 50,
      taxStrategies: 50
    }
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('persona-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
        
        // Set persona from saved preferences if remember is enabled
        if (parsed.rememberLastPersona && parsed.defaultPersona) {
          setPersonaState(parsed.defaultPersona);
        }
      } catch (err) {
        console.error('Error loading persona preferences:', err);
      }
    }
    
    const savedExperience = localStorage.getItem('user-experience');
    if (savedExperience) {
      try {
        const parsed = JSON.parse(savedExperience);
        setUserExperience(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('Error loading user experience:', err);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('persona-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Save user experience to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('user-experience', JSON.stringify(userExperience));
  }, [userExperience]);

  // Update persona and save to preferences
  const setPersona = (newPersona: UserPersona) => {
    setPersonaState(newPersona);
    
    // Update preferences if remember is enabled
    if (preferences.rememberLastPersona) {
      updatePreferences({ defaultPersona: newPersona });
    }
    
    // Track persona switch
    trackPersonaUsage('persona_switch', { 
      from: persona, 
      to: newPersona,
      timestamp: new Date().toISOString()
    });
  };

  // Transform analysis data for current persona
  const transformData = (analysisData: Analysis, propertyData: SFRPropertyData): PersonaSpecificData => {
    setIsLoading(true);
    setError(null);
    
    try {
      const transformed = PersonaDataTransformer.transformForPersona(
        analysisData,
        propertyData,
        persona
      );
      
      setPersonaData(transformed);
      setIsLoading(false);
      
      // Track data transformation
      trackPersonaUsage('data_transform', {
        persona,
        metricsCount: transformed.coreMetrics.length,
        insightsCount: transformed.insights.length,
        timestamp: new Date().toISOString()
      });
      
      return transformed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transform data';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  // Update preferences
  const updatePreferences = (updates: Partial<PersonaPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Update user experience
  const updateUserExperience = (updates: Partial<UserExperience>) => {
    setUserExperience(prev => ({ ...prev, ...updates }));
  };

  // Track persona usage analytics
  const trackPersonaUsage = (action: string, metadata: any = {}) => {
    // In a real app, this would send to analytics service
    console.log('Persona Analytics:', {
      action,
      persona,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    // Store in localStorage for now
    const analytics = JSON.parse(localStorage.getItem('persona-analytics') || '[]');
    analytics.push({
      action,
      persona,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 events
    if (analytics.length > 1000) {
      analytics.splice(0, analytics.length - 1000);
    }
    
    localStorage.setItem('persona-analytics', JSON.stringify(analytics));
  };

  const contextValue: PersonaContextType = {
    persona,
    setPersona,
    personaData,
    transformData,
    preferences,
    updatePreferences,
    userExperience,
    updateUserExperience,
    isLoading,
    error,
    availablePersonas: PERSONA_CONFIGS,
    trackPersonaUsage
  };

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
};

// Custom hook to use persona context
export const usePersona = (): PersonaContextType => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};

// Hook to get persona-specific configuration
export const usePersonaConfig = () => {
  const { persona, availablePersonas } = usePersona();
  return availablePersonas[persona];
};

// Hook to check if a feature is enabled for current persona
export const usePersonaFeature = (featureName: keyof PersonaConfig['uiConfig']) => {
  const config = usePersonaConfig();
  return config.uiConfig[featureName];
};

// Hook to get persona-specific styling
export const usePersonaTheme = () => {
  const { persona, preferences } = usePersona();
  const config = usePersonaConfig();
  
  const baseTheme = config.uiConfig;
  const customTheme = preferences.customizations[persona]?.customTheme || {};
  
  return {
    ...baseTheme,
    ...customTheme
  };
};

// Hook for persona analytics
export const usePersonaAnalytics = () => {
  const { trackPersonaUsage } = usePersona();
  
  return {
    trackPersonaUsage,
    trackMetricView: (metricId: string) => {
      trackPersonaUsage('metric_view', { metricId });
    },
    trackInsightExpand: (insightId: string) => {
      trackPersonaUsage('insight_expand', { insightId });
    },
    trackActionClick: (actionId: string) => {
      trackPersonaUsage('action_click', { actionId });
    },
    trackEducationalContent: (contentId: string) => {
      trackPersonaUsage('educational_content', { contentId });
    }
  };
};