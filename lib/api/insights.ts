import { apiClient } from './client';
import {
  RecommendationsListResponseDto,
  RecommendationsSummaryResponseDto,
  DemandTrendsResponseDto,
  ReportsListResponseDto,
  SingleWeeklyReportResponseDto,
  ApplyRecommendationPayload,
  DismissRecommendationPayload,
  InsightCategory,
  InsightImpact,
  RecommendationStatus,
} from '@/types/insights';

export interface GetRecommendationsParams {
  status?: RecommendationStatus;
  category?: InsightCategory;
  impact?: InsightImpact;
  page?: number;
  limit?: number;
}

export interface GetDemandTrendsParams {
  from?: string;
  to?: string;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
}

export const insightsApi = {
  getRecommendations: async (
    workspaceId: string,
    params?: GetRecommendationsParams
  ): Promise<RecommendationsListResponseDto> => {
    const res = await apiClient.get<RecommendationsListResponseDto>(
      `/workspaces/${workspaceId}/recommendations`,
      { params }
    );
    return res.data;
  },

  getSummary: async (
    workspaceId: string
  ): Promise<RecommendationsSummaryResponseDto> => {
    const res = await apiClient.get<RecommendationsSummaryResponseDto>(
      `/workspaces/${workspaceId}/recommendations/summary`
    );
    return res.data;
  },

  applyRecommendation: async (
    workspaceId: string,
    id: string,
    payload?: ApplyRecommendationPayload
  ): Promise<{ status: 'IMPLEMENTED'; recommendationId: string }> => {
    const res = await apiClient.post<{ status: 'IMPLEMENTED'; recommendationId: string }>(
      `/workspaces/${workspaceId}/recommendations/${id}/apply`,
      payload || {}
    );
    return res.data;
  },

  dismissRecommendation: async (
    workspaceId: string,
    id: string,
    payload: DismissRecommendationPayload
  ): Promise<{ status: 'DISMISSED'; recommendationId: string }> => {
    const res = await apiClient.post<{ status: 'DISMISSED'; recommendationId: string }>(
      `/workspaces/${workspaceId}/recommendations/${id}/dismiss`,
      payload
    );
    return res.data;
  },

  getDemandTrends: async (
    workspaceId: string,
    params?: GetDemandTrendsParams
  ): Promise<DemandTrendsResponseDto> => {
    const res = await apiClient.get<DemandTrendsResponseDto>(
      `/workspaces/${workspaceId}/recommendations/demand-trends`,
      { params }
    );
    return res.data;
  },

  getReports: async (
    workspaceId: string,
    params?: GetReportsParams
  ): Promise<ReportsListResponseDto> => {
    const res = await apiClient.get<ReportsListResponseDto>(
      `/workspaces/${workspaceId}/reports`,
      { params }
    );
    return res.data;
  },

  getReportById: async (
    workspaceId: string,
    reportId: string
  ): Promise<SingleWeeklyReportResponseDto> => {
    const res = await apiClient.get<SingleWeeklyReportResponseDto>(
      `/workspaces/${workspaceId}/reports/${reportId}`
    );
    return res.data;
  },
};
