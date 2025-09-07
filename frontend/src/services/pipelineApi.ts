import api from './api'; // Use the configured axios instance with interceptors
import type { 
  PipelineDeal, 
  CreatePipelineDealRequest, 
  UpdatePipelineDealRequest,
  PipelineFilters,
  KanbanData,
  PipelineAnalytics
} from '../types/pipeline';
import { DealStage } from '../types/pipeline';

export const pipelineApi = {
  // Get all pipeline deals with filters
  getDeals: async (filters?: PipelineFilters, pagination?: { limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.propertyType) params.append('propertyType', filters.propertyType);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.source) params.append('source', filters.source);
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.offset) params.append('offset', pagination.offset.toString());

    const response = await api.get(`/pipeline/deals?${params.toString()}`);
    return response.data;
  },

  // Get single deal by ID
  getDealById: async (dealId: string) => {
    const response = await api.get(`/pipeline/deals/${dealId}`);
    return response.data.data as PipelineDeal;
  },

  // Create new pipeline deal
  createDeal: async (dealData: CreatePipelineDealRequest) => {
    const response = await api.post('/pipeline/deals', dealData);
    return response.data.data as PipelineDeal;
  },

  // Update pipeline deal
  updateDeal: async (dealId: string, updates: UpdatePipelineDealRequest) => {
    const response = await api.put(`/pipeline/deals/${dealId}`, updates);
    return response.data.data as PipelineDeal;
  },

  // Delete pipeline deal
  deleteDeal: async (dealId: string) => {
    const response = await api.delete(`/pipeline/deals/${dealId}`);
    return response.data;
  },

  // Update deal stage
  updateDealStage: async (dealId: string, stage: DealStage, notes?: string) => {
    const response = await api.put(`/pipeline/deals/${dealId}/stage`, { stage, notes });
    return response.data.data as PipelineDeal;
  },

  // Get Kanban board data
  getKanbanData: async () => {
    const response = await api.get('/pipeline/kanban');
    return response.data.data as KanbanData;
  },

  // Link existing analysis to deal
  linkAnalysis: async (dealId: string, analysisId: string) => {
    const response = await api.post(`/pipeline/deals/${dealId}/link-analysis`, { analysisId });
    return response.data.data as PipelineDeal;
  },

  // Convert analysis to pipeline deal
  convertAnalysisToPipeline: async (analysisId: string, sourceInfo: any, notes?: string) => {
    const response = await api.post('/pipeline/convert-analysis', { analysisId, sourceInfo, notes });
    return response.data.data as PipelineDeal;
  },

  // Get pipeline analytics
  getAnalytics: async () => {
    const response = await api.get('/pipeline/analytics');
    return response.data.data as PipelineAnalytics;
  },

  // Save quick metrics from skinny calculator
  saveQuickMetrics: async (dealId: string, metrics: any) => {
    const response = await api.put(`/pipeline/deals/${dealId}/quick-metrics`, { metrics });
    return response.data.data as PipelineDeal;
  }
};