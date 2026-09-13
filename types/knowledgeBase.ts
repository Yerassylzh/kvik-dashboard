export type KnowledgeType =
  | 'DOCUMENT'
  | 'MANUAL_NOTE'
  | 'WEBSITE_CONTENT'
  | 'LOCAL_LISTING'
  | 'REALTY_LISTING'
  | 'CAR_LISTING';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface KnowledgeBaseStatsDto {
  totalEntries: number;
  countsByType: {
    DOCUMENT?: number;
    MANUAL_NOTE?: number;
    WEBSITE_CONTENT?: number;
    LOCAL_LISTING?: number;
    [key: string]: number | undefined;
  };
  statusSummary: {
    COMPLETED?: number;
    PENDING?: number;
    PROCESSING?: number;
    FAILED?: number;
    [key: string]: number | undefined;
  };
  totalChunks: number;
  storageUsageBytes: number;
  lastIndexedAt?: string | null;
  businessContextAvailable?: boolean;
  aiEngineStatus?: {
    toolsActive?: number;
    customInstructionsConfigured?: boolean;
    followUpActive?: boolean;
  };
}

export interface KnowledgeEntryDto {
  id: string;
  workspaceId: string;
  type: KnowledgeType;
  title?: string | null;
  externalId?: string | null;
  data?: Record<string, any>;
  sourceUrl?: string | null;
  fileKey?: string | null;
  fileMimeType?: string | null;
  fileSize?: number | null;
  processingStatus: ProcessingStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntryListDto {
  entries: KnowledgeEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeDocumentDto {
  id: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  processingStatus: ProcessingStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManualNoteDto {
  id: string;
  title?: string | null;
  note: string;
  processingStatus: ProcessingStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManualNoteResponseDto {
  code: string;
  note: ManualNoteDto;
}

export interface WebsiteScraperStatus {
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'IDLE';
  targetUrl?: string | null;
  pagesFound?: number;
  pagesDone?: number;
  error?: string | null;
}

export interface TwoGisScraperStatus {
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'IDLE';
  branchId?: string | null;
  itemsFound?: number;
  itemsDone?: number;
  error?: string | null;
}

export interface ScrapersStatusDto {
  website?: WebsiteScraperStatus;
  twoGis?: TwoGisScraperStatus;
}

export interface BusinessProfileDto {
  businessName: string;
  nicheProfile?: string;
  subSegment?: string;
  city?: string;
  country?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessDescription?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  workingHours?: string;
  teamSize?: number;
  timezone?: string;
  updatedAt?: string;
}

export interface UpdateBusinessProfileDto {
  businessName?: string;
  city?: string;
  country?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessDescription?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  workingHours?: string;
  teamSize?: number;
  timezone?: string;
}

export interface QualificationQuestion {
  id: string;
  field: string;
  question: string;
  required?: boolean;
}

export interface QualificationRulesDto {
  qualificationRulesSet: boolean;
  qualificationRules?: {
    questions?: QualificationQuestion[];
    disqualifiers?: string[];
    autoPassConditions?: string[];
    budgetMin?: number;
    budgetMax?: number;
    mortgage?: boolean;
    district?: string;
    urgency?: string;
  } | null;
}

export interface UpdateQualificationPayload {
  questions?: QualificationQuestion[];
  disqualifiers?: string[];
  autoPassConditions?: string[];
  budgetMin?: number;
  budgetMax?: number;
  mortgage?: boolean;
  district?: string;
  urgency?: string;
}

export interface ChunkSearchResultDto {
  chunkIndex: number;
  content: string;
  score?: number;
  similarity?: number;
  knowledgeEntryId?: string;
  knowledgeEntryTitle?: string;
  type?: KnowledgeType;
  metadata?: Record<string, any>;
}

export interface SearchTestResponseDto {
  query: string;
  k?: number;
  results: ChunkSearchResultDto[];
}
