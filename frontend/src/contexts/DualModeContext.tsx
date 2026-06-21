// Dual-Mode Context - Abstraction layer over PersonaContext
// Created: Phase 1 Dual-Mode Implementation
// Leverages existing PersonaContext for maximum code reuse

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { usePersona } from './PersonaContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { UserPersona } from '../types/persona';
import { type UserMode } from '../types/auth';

export type { UserMode } from '../types/auth';

interface DualModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  isLoading: boolean;
  error: string | null;
  
  // Utility functions
  isNoviceMode: () => boolean;
  isProMode: () => boolean;
  
  // Persona mapping functions
  getCurrentPersonaForMode: () => UserPersona;
  getMappedPersona: (mode: UserMode) => UserPersona;
  
  // Mode switching analytics
  trackModeSwitch: (fromMode: UserMode, toMode: UserMode) => void;
}

const DualModeContext = createContext<DualModeContextType | undefined>(undefined);

// Persona to Mode mapping based on our hybrid architecture analysis
const PERSONA_MODE_MAPPING = {
  // Novice Mode Personas (Educational and Quick Decision Focus)
  [UserPersona.LEARNING]: 'novice' as UserMode,
  [UserPersona.SPEED_SCANNER]: 'novice' as UserMode,
  
  // Pro Mode Personas (Strategic and Data-Driven Focus) 
  [UserPersona.EXPERIENCED]: 'pro' as UserMode,
  [UserPersona.DATA_ANALYST]: 'pro' as UserMode,
};

// Default persona mapping for each mode
const DEFAULT_MODE_PERSONAS = {
  novice: UserPersona.LEARNING,
  pro: UserPersona.EXPERIENCED,
};

export const DualModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { persona, setPersona, trackPersonaUsage } = usePersona();
  const { user, isAuthenticated } = useAuth();
  
  // Get current mode based on active persona
  const getCurrentMode = (): UserMode => {
    return PERSONA_MODE_MAPPING[persona] || 'novice';
  };
  
  const [mode, setModeState] = useState<UserMode>(getCurrentMode);
  
  // Sync mode state with persona changes
  useEffect(() => {
    const currentModeFromPersona = getCurrentMode();
    if (currentModeFromPersona !== mode) {
      setModeState(currentModeFromPersona);
    }
  }, [persona, mode]);
  
  // Load mode from user preferences on authentication
  useEffect(() => {
    const loadUserModePreference = async () => {
      if (isAuthenticated && user?.dualModePreferences?.currentMode) {
        const savedMode = user.dualModePreferences.currentMode;
        if (savedMode !== mode) {
          await setMode(savedMode);
        }
      }
    };
    
    loadUserModePreference();
  }, [isAuthenticated, user]);
  
  // Set mode and update underlying persona
  const setMode = async (newMode: UserMode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oldMode = mode;
      
      // Get the target persona for the new mode
      let targetPersona: UserPersona;
      
      if (isAuthenticated && user?.dualModePreferences?.personaMapping) {
        // Use user's custom persona mapping if available
        targetPersona = user.dualModePreferences.personaMapping[newMode];
      } else {
        // Use default mapping
        targetPersona = DEFAULT_MODE_PERSONAS[newMode];
      }
      
      // Update persona (this will trigger the PersonaContext)
      setPersona(targetPersona);
      
      // Update mode state
      setModeState(newMode);
      
      // Save to backend if authenticated
      if (isAuthenticated) {
        try {
          // Task #85b: previously `/api/auth/dual-mode` — double-prefixed
          // because api.baseURL already includes `/api`. Per FRONTEND_API_STANDARDS.md
          // routes here are bare `/auth/...`.
          await api.put('/auth/dual-mode', {
            mode: newMode,
            targetPersona
          });
        } catch (apiError) {
          console.warn('Failed to save mode preference to backend:', apiError);
          // Continue - don't fail the mode switch for this
        }
      }
      
      // Save to localStorage for immediate persistence
      localStorage.setItem('dualMode', newMode);
      localStorage.setItem('dualModePersona', targetPersona);
      
      // Track the mode switch
      trackModeSwitch(oldMode, newMode);
      
      setIsLoading(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch mode';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Mode switch error:', err);
    }
  };
  
  // Utility functions
  const isNoviceMode = () => mode === 'novice';
  const isProMode = () => mode === 'pro';
  
  const getCurrentPersonaForMode = () => persona;
  
  const getMappedPersona = (targetMode: UserMode): UserPersona => {
    if (isAuthenticated && user?.dualModePreferences?.personaMapping) {
      return user.dualModePreferences.personaMapping[targetMode];
    }
    return DEFAULT_MODE_PERSONAS[targetMode];
  };
  
  const trackModeSwitch = (fromMode: UserMode, toMode: UserMode) => {
    // Use existing persona analytics system
    trackPersonaUsage('dual_mode_switch', {
      fromMode,
      toMode,
      fromPersona: PERSONA_MODE_MAPPING[persona],
      toPersona: persona,
      timestamp: new Date().toISOString(),
      authenticated: isAuthenticated
    });
    
    // Additional dual-mode specific analytics
    const modeAnalytics = JSON.parse(localStorage.getItem('dual-mode-analytics') || '[]');
    modeAnalytics.push({
      action: 'mode_switch',
      fromMode,
      toMode,
      timestamp: new Date().toISOString(),
      sessionId: localStorage.getItem('sessionId') || 'anonymous'
    });
    
    // Keep only last 500 events
    if (modeAnalytics.length > 500) {
      modeAnalytics.splice(0, modeAnalytics.length - 500);
    }
    
    localStorage.setItem('dual-mode-analytics', JSON.stringify(modeAnalytics));
  };
  
  const contextValue: DualModeContextType = {
    mode,
    setMode,
    isLoading,
    error,
    isNoviceMode,
    isProMode,
    getCurrentPersonaForMode,
    getMappedPersona,
    trackModeSwitch
  };
  
  return (
    <DualModeContext.Provider value={contextValue}>
      {children}
    </DualModeContext.Provider>
  );
};

// Custom hook to use dual-mode context
export const useDualMode = (): DualModeContextType => {
  const context = useContext(DualModeContext);
  if (!context) {
    throw new Error('useDualMode must be used within a DualModeProvider');
  }
  return context;
};

// Hook to get mode-aware configuration
export const useModeConfig = () => {
  const { mode, isNoviceMode, isProMode } = useDualMode();
  
  return {
    mode,
    isNoviceMode: isNoviceMode(),
    isProMode: isProMode(),
    config: {
      showEducationalTooltips: isNoviceMode(),
      showAllMetrics: isProMode(),
      maxDisplayedMetrics: isNoviceMode() ? 8 : undefined,
      analysisComplexity: isNoviceMode() ? 'basic' : 'comprehensive',
      enableAdvancedFeatures: isProMode(),
      progressiveDisclosure: isNoviceMode()
    }
  };
};

// Hook for educational content management
export const useEducationalContent = () => {
  const { isNoviceMode } = useDualMode();
  
  return {
    shouldShowTooltips: isNoviceMode(),
    shouldShowGuidance: isNoviceMode(),
    shouldShowGlossary: isNoviceMode(),
    shouldShowProgress: isNoviceMode(),
    getContentLevel: () => isNoviceMode() ? 'beginner' : 'advanced'
  };
};

// Hook for analytics specific to dual-mode
export const useDualModeAnalytics = () => {
  const { trackModeSwitch } = useDualMode();
  
  return {
    trackModeSwitch,
    trackTooltipView: (tooltipId: string) => {
      const analytics = JSON.parse(localStorage.getItem('dual-mode-analytics') || '[]');
      analytics.push({
        action: 'tooltip_view',
        tooltipId,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('dual-mode-analytics', JSON.stringify(analytics));
    },
    trackEducationalContent: (contentId: string, action: string) => {
      const analytics = JSON.parse(localStorage.getItem('dual-mode-analytics') || '[]');
      analytics.push({
        action: 'educational_content',
        contentId,
        contentAction: action,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('dual-mode-analytics', JSON.stringify(analytics));
    }
  };
};