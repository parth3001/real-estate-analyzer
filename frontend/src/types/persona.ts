// Persona-based AI Control Center Types
// Created: July 15, 2025

export const UserPersona = {
  LEARNING: 'learning',
  EXPERIENCED: 'experienced', 
  DATA_ANALYST: 'data_analyst',
  SPEED_SCANNER: 'speed_scanner'
} as const;

export type UserPersona = typeof UserPersona[keyof typeof UserPersona];

export interface PersonaConfig {
  id: UserPersona;
  name: string;
  description: string;
  icon: string;
  timeToAnalyze: string;
  targetUser: string;
  primaryGoal: string;
  keyFeatures: string[];
  uiConfig: {
    showEducationalTooltips: boolean;
    showAllMetrics: boolean;
    enableBatchAnalysis: boolean;
    defaultExpanded: boolean;
    maxSummaryBullets: number;
    showProgressIndicators: boolean;
    enableQuickActions: boolean;
    highlightRiskAlerts: boolean;
  };
}

export interface CoreMetricData {
  id: string;
  name: string;
  value: string | number;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
  importance: 'critical' | 'high' | 'medium' | 'low';
  explanation?: string;
  educationalContent?: {
    tooltip: string;
    learnMoreUrl?: string;
    whyItMatters: string;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface PersonaInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'short_term' | 'long_term';
  confidence: number; // 0-100
  educationalContent?: {
    explanation: string;
    actionSteps: string[];
    learnMoreUrl?: string;
  };
}

export interface PersonaAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'warning' | 'info';
  icon?: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  educationalTooltip?: string;
}

export interface PresentationConfig {
  layout: 'cards' | 'list' | 'dashboard' | 'summary';
  grouping: 'category' | 'importance' | 'chronological' | 'none';
  sortBy: 'importance' | 'alphabetical' | 'value' | 'custom';
  showAnimations: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
  theme: 'default' | 'professional' | 'educational' | 'minimal';
}

export interface PersonaSpecificData {
  persona: UserPersona;
  coreMetrics: CoreMetricData[];
  insights: PersonaInsight[];
  actions: PersonaAction[];
  presentation: PresentationConfig;
  summary: {
    verdict: 'strong_buy' | 'buy' | 'hold' | 'pass' | 'avoid';
    score: number; // 0-100
    confidence: number; // 0-100
    keyPoints: string[];
    riskAlerts: string[];
    nextSteps: string[];
  };
  educational?: {
    conceptsIntroduced: string[];
    learningResources: Array<{
      title: string;
      url: string;
      type: 'article' | 'video' | 'calculator' | 'guide';
    }>;
    progressTracking: {
      conceptsLearned: string[];
      analysesCompleted: number;
      proficiencyLevel: number; // 0-100
    };
  };
}

export interface PersonaPreferences {
  defaultPersona: UserPersona;
  allowPersonaSwitching: boolean;
  rememberLastPersona: boolean;
  customizations: Record<UserPersona, {
    pinnedMetrics: string[];
    hiddenSections: string[];
    customTheme: Partial<PresentationConfig>;
  }>;
  notifications: {
    riskAlerts: boolean;
    marketUpdates: boolean;
    educationalTips: boolean;
  };
}

export interface UserExperience {
  yearsInvesting: number;
  propertiesAnalyzed: number;
  propertiesOwned: number;
  preferredPropertyTypes: string[];
  investmentGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  knowledgeAreas: {
    financialAnalysis: number; // 0-100
    marketAnalysis: number; // 0-100
    propertyManagement: number; // 0-100
    taxStrategies: number; // 0-100
  };
}

export interface PersonaMetrics {
  usage: {
    totalAnalyses: number;
    averageTimePerAnalysis: number;
    mostUsedFeatures: string[];
    personaSwitchFrequency: number;
  };
  performance: {
    taskCompletionRate: number;
    userSatisfactionScore: number;
    featureAdoptionRate: number;
    errorRate: number;
  };
  learning: {
    conceptsLearned: string[];
    skillProgression: Record<string, number>;
    certificationProgress: number;
  };
}

// Persona Configuration Constants
export const PERSONA_CONFIGS: Record<UserPersona, PersonaConfig> = {
  [UserPersona.LEARNING]: {
    id: UserPersona.LEARNING,
    name: 'Learning Investor',
    description: 'New to real estate investing, wants to understand the process',
    icon: '📚',
    timeToAnalyze: '10-15 minutes',
    targetUser: '0-2 years experience',
    primaryGoal: 'Learn while analyzing',
    keyFeatures: [
      'Educational tooltips on all metrics',
      'Step-by-step analysis walkthrough',
      'Links to learning resources',
      'Progress tracking'
    ],
    uiConfig: {
      showEducationalTooltips: true,
      showAllMetrics: false,
      enableBatchAnalysis: false,
      defaultExpanded: true,
      maxSummaryBullets: 5,
      showProgressIndicators: true,
      enableQuickActions: false,
      highlightRiskAlerts: true
    }
  },
  [UserPersona.EXPERIENCED]: {
    id: UserPersona.EXPERIENCED,
    name: 'Experienced Investor',
    description: 'Know the basics, want efficient analysis with key insights',
    icon: '💼',
    timeToAnalyze: '5-8 minutes',
    targetUser: '2-10 years experience',
    primaryGoal: 'Efficient decision-making',
    keyFeatures: [
      'Executive summary format',
      'Key metrics highlighted',
      'Risk/opportunity callouts',
      'Contextual market insights'
    ],
    uiConfig: {
      showEducationalTooltips: false,
      showAllMetrics: false,
      enableBatchAnalysis: false,
      defaultExpanded: false,
      maxSummaryBullets: 3,
      showProgressIndicators: false,
      enableQuickActions: true,
      highlightRiskAlerts: true
    }
  },
  [UserPersona.DATA_ANALYST]: {
    id: UserPersona.DATA_ANALYST,
    name: 'Data Analyst',
    description: 'Want to dive deep into all metrics and correlations',
    icon: '📊',
    timeToAnalyze: '15-30 minutes',
    targetUser: 'Data-focused (any experience)',
    primaryGoal: 'Comprehensive analysis',
    keyFeatures: [
      'All 134+ metrics accessible',
      'Advanced charts and graphs',
      'Data export functionality',
      'Customizable dashboards'
    ],
    uiConfig: {
      showEducationalTooltips: false,
      showAllMetrics: true,
      enableBatchAnalysis: false,
      defaultExpanded: true,
      maxSummaryBullets: 7,
      showProgressIndicators: false,
      enableQuickActions: true,
      highlightRiskAlerts: false
    }
  },
  [UserPersona.SPEED_SCANNER]: {
    id: UserPersona.SPEED_SCANNER,
    name: 'Speed Scanner',
    description: 'Analyzing many deals, need quick yes/no decisions',
    icon: '⚡',
    timeToAnalyze: '1-3 minutes',
    targetUser: '5+ years experience',
    primaryGoal: 'Rapid deal screening',
    keyFeatures: [
      'Instant AI verdict',
      '3-bullet summary format',
      'Red flag alerts',
      'Batch analysis capabilities'
    ],
    uiConfig: {
      showEducationalTooltips: false,
      showAllMetrics: false,
      enableBatchAnalysis: true,
      defaultExpanded: false,
      maxSummaryBullets: 3,
      showProgressIndicators: false,
      enableQuickActions: true,
      highlightRiskAlerts: true
    }
  }
};