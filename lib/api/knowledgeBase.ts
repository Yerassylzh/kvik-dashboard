import { apiClient } from './client';
import type {
  KnowledgeBaseStatsDto,
  BusinessProfileDto,
  UpdateBusinessProfileDto,
  KnowledgeDocumentDto,
  ManualNoteDto,
  ManualNoteResponseDto,
  ScrapersStatusDto,
  KnowledgeEntryListDto,
  KnowledgeEntryDto,
  QualificationRulesDto,
  UpdateQualificationPayload,
  SearchTestResponseDto,
} from '@/types/knowledgeBase';

export * from '@/types/knowledgeBase';

export const knowledgeBaseApi = {
  // Stats
  getStats: async (): Promise<KnowledgeBaseStatsDto> => {
    const { data } = await apiClient.get<KnowledgeBaseStatsDto>('/knowledge-base/stats');
    return data;
  },

  // Business Profile
  getProfile: async (): Promise<{ code: string; profile: BusinessProfileDto }> => {
    const { data } = await apiClient.get<{ code: string; profile: BusinessProfileDto }>(
      '/knowledge-base/profile'
    );
    return data;
  },

  updateProfile: async (
    payload: UpdateBusinessProfileDto
  ): Promise<{ code: string; message: string; profile: BusinessProfileDto }> => {
    const { data } = await apiClient.put<{ code: string; message: string; profile: BusinessProfileDto }>(
      '/knowledge-base/profile',
      payload
    );
    return data;
  },

  // Documents
  getDocuments: async (): Promise<KnowledgeDocumentDto[]> => {
    const { data } = await apiClient.get<KnowledgeDocumentDto[]>('/knowledge-base/documents');
    return data;
  },

  uploadDocument: async (file: File): Promise<KnowledgeDocumentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<KnowledgeDocumentDto>(
      '/knowledge-base/documents',
      formData
    );
    return data;
  },

  // Manual Notes
  getNotes: async (): Promise<ManualNoteDto[]> => {
    const { data } = await apiClient.get<ManualNoteDto[]>('/knowledge-base/notes');
    return data;
  },

  getNote: async (id: string): Promise<ManualNoteResponseDto> => {
    const { data } = await apiClient.get<ManualNoteResponseDto>(`/knowledge-base/notes/${id}`);
    return data;
  },

  createNotes: async (
    notes: string[]
  ): Promise<{ code: string; count: number; notes: ManualNoteDto[] }> => {
    const { data } = await apiClient.post<{ code: string; count: number; notes: ManualNoteDto[] }>(
      '/knowledge-base/notes',
      { notes }
    );
    return data;
  },

  updateNote: async (
    id: string,
    payload: { title?: string; note: string }
  ): Promise<{ code: string; message: string; note: ManualNoteDto }> => {
    const { data } = await apiClient.put<{ code: string; message: string; note: ManualNoteDto }>(
      `/knowledge-base/notes/${id}`,
      payload
    );
    return data;
  },

  deleteNote: async (id: string): Promise<{ code: string; id: string }> => {
    const { data } = await apiClient.delete<{ code: string; id: string }>(
      `/knowledge-base/notes/${id}`
    );
    return data;
  },

  // Scrapers
  getScrapersStatus: async (): Promise<ScrapersStatusDto> => {
    const { data } = await apiClient.get<ScrapersStatusDto>('/knowledge-base/scrapers/status');
    return data;
  },

  triggerWebsiteScrape: async (
    websiteUrl?: string,
    forceRecrawl?: boolean
  ): Promise<unknown> => {
    const { data } = await apiClient.post('/knowledge-base/scrapers/website', {
      websiteUrl,
      forceRecrawl,
    });
    return data;
  },

  triggerTwoGisScrape: async (
    input: string,
    forceRecrawl?: boolean
  ): Promise<unknown> => {
    const { data } = await apiClient.post('/knowledge-base/scrapers/2gis', {
      input,
      forceRecrawl,
    });
    return data;
  },

  clearScrapedData: async (
    type: 'website' | '2gis'
  ): Promise<{ code: string; type: string; deletedCount: number }> => {
    const { data } = await apiClient.delete<{ code: string; type: string; deletedCount: number }>(
      `/knowledge-base/scrapers/${type}`
    );
    return data;
  },

  // Knowledge Entries & Bulk Actions
  getEntries: async (params?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<KnowledgeEntryListDto> => {
    const { data } = await apiClient.get<KnowledgeEntryListDto>('/knowledge-base/entries', {
      params,
    });
    return data;
  },

  getEntry: async (id: string): Promise<KnowledgeEntryDto> => {
    const { data } = await apiClient.get<KnowledgeEntryDto>(`/knowledge-base/entries/${id}`);
    return data;
  },

  updateEntry: async (
    id: string,
    payload: { title?: string; active?: boolean }
  ): Promise<{ code: string; entry: KnowledgeEntryDto }> => {
    const { data } = await apiClient.patch<{ code: string; entry: KnowledgeEntryDto }>(
      `/knowledge-base/entries/${id}`,
      payload
    );
    return data;
  },

  deleteEntry: async (id: string): Promise<{ code: string; id: string }> => {
    const { data } = await apiClient.delete<{ code: string; id: string }>(
      `/knowledge-base/entries/${id}`
    );
    return data;
  },

  bulkDeleteEntries: async (
    ids: string[]
  ): Promise<{ code: string; deletedCount: number }> => {
    const { data } = await apiClient.post<{ code: string; deletedCount: number }>(
      '/knowledge-base/entries/bulk-delete',
      { ids }
    );
    return data;
  },

  reindexEntry: async (
    id: string
  ): Promise<{ code: string; id: string; processingStatus: string }> => {
    const { data } = await apiClient.post<{ code: string; id: string; processingStatus: string }>(
      `/knowledge-base/entries/${id}/reindex`
    );
    return data;
  },

  // Lead Qualification
  getQualification: async (): Promise<QualificationRulesDto> => {
    const { data } = await apiClient.get<QualificationRulesDto>(
      '/knowledge-base/qualification'
    );
    return data;
  },

  updateQualification: async (
    payload: UpdateQualificationPayload
  ): Promise<{ code: string; message: string; data: QualificationRulesDto }> => {
    const { data } = await apiClient.put<{ code: string; message: string; data: QualificationRulesDto }>(
      '/knowledge-base/qualification',
      payload
    );
    return data;
  },

  // Semantic Vector Search Sandbox
  testSearch: async (q: string, k?: number): Promise<SearchTestResponseDto> => {
    const { data } = await apiClient.get<SearchTestResponseDto>('/knowledge-base/search', {
      params: { q, k },
    });
    return data;
  },
};
