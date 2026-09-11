import { apiClient } from './client';
import {
  BusinessProfileDto,
  BusinessContext,
  ChannelDto,
  DataPreviewResponse,
  KnowledgeEntriesResponse,
  KnowledgeNotesDto,
  OnboardingStateResponse,
  QualificationDto,
  ScrapingStatusResponse,
  ScrapingType,
  SelectNicheDto,
  TwoGisScrapingDto,
  WebsiteScrapingDto,
} from '@/types/niche';

// --- State ---

export async function getOnboardingState(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.get<OnboardingStateResponse>('/onboarding/state');
  return data;
}

// --- Step 0: Niche (calendar verticals only) ---

export async function selectNicheStep(dto: SelectNicheDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/niche', dto);
  return data;
}

// --- Step 1: Business profile ---

export async function submitBusinessProfile(dto: BusinessProfileDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/business-profile', dto);
  return data;
}

export async function updateBusinessProfile(dto: BusinessProfileDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.put<OnboardingStateResponse>('/onboarding/step/business-profile', dto);
  return data;
}

// --- Step 2: Knowledge base ingestion ---

export async function start2gisScraping(dto: TwoGisScrapingDto): Promise<void> {
  await apiClient.post('/onboarding/step/2gis-scraping', dto);
}

export async function startWebsiteScraping(dto: WebsiteScrapingDto): Promise<void> {
  await apiClient.post('/onboarding/step/website-scraping', dto);
}

export async function getScrapingStatus(type: ScrapingType): Promise<ScrapingStatusResponse> {
  const { data } = await apiClient.get<ScrapingStatusResponse>('/onboarding/scraping/status', {
    params: { type },
  });
  return data;
}

export interface SaveNotesResponse {
  code: string;
  count: number;
  notes: Array<{
    id: string;
    note: string;
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
  }>;
}

export async function addKnowledgeNote(dto: KnowledgeNotesDto): Promise<SaveNotesResponse> {
  const { data } = await apiClient.post<SaveNotesResponse>('/onboarding/step/knowledge-notes', dto);
  return data;
}

export interface KnowledgeNoteStatus {
  id: string;
  note: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export async function getKnowledgeNotes(): Promise<KnowledgeNoteStatus[]> {
  const { data } = await apiClient.get<KnowledgeNoteStatus[]>('/onboarding/knowledge-notes');
  return data;
}

export async function uploadKnowledgeDocument(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await apiClient.post('/onboarding/step/knowledge-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function confirmDataSourceStep(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/data-source-confirm');
  return data;
}

// --- Step 3: Preview & confirmation ---

export async function getDataPreview(): Promise<DataPreviewResponse> {
  const { data } = await apiClient.get<DataPreviewResponse>('/onboarding/step/data-preview');
  return data;
}

export async function getKnowledgeEntries(): Promise<KnowledgeEntriesResponse> {
  const { data } = await apiClient.get<KnowledgeEntriesResponse>('/onboarding/knowledge-entries');
  return data;
}

export async function getBusinessContext(): Promise<BusinessContext> {
  const { data } = await apiClient.get<BusinessContext>('/onboarding/business-context');
  return data;
}

export async function confirmDataPreview(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/data-confirm');
  return data;
}

// --- Step 4: Channel ---

export async function submitChannel(dto: ChannelDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/channel', dto);
  return data;
}

export async function confirmChannelStep(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/channel-confirm');
  return data;
}

export async function skipChannelStep(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/channel-skip');
  return data;
}

// --- Step 5: Qualification rules ---

export async function submitQualification(dto: QualificationDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>(
    '/onboarding/step/qualification',
    dto
  );
  return data;
}

// --- Step 6: Complete ---

export async function completeOnboarding(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/complete');
  return data;
}
