export type NicheProfile =
  | 'REALTY'
  | 'AUTO_SALES'
  | 'AUTO_SERVICE'
  | 'BEAUTY'
  | 'CLINIC'
  | 'OTHER_CALENDAR';

export type OnboardingStepState =
  | 'SELECT_NICHE'
  | 'BUSINESS_PROFILE'
  | 'DATA_SOURCE'
  | 'DATA_PREVIEW'
  | 'CONNECT_CHANNEL'
  | 'QUALIFICATION'
  | 'COMPLETE_TEST'
  | 'DONE';

export type ParsingStatus = 'IDLE' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface OnboardingStateResponse {
  step: OnboardingStepState;
  stepIndex: number;
  completed: boolean;
  // Присутствуют только на шагах DATA_SOURCE (2) и DATA_PREVIEW (3):
  parsingStatus?: ParsingStatus;
  parsedCount?: number;
  totalCount?: number;
  failedCount?: number;
  error?: string;
}

export interface BusinessProfileDto {
  businessName: string;
  city: string;
  businessPhone?: string;
  businessDescription?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  workingHours?: string;
}

export interface DataSourceDto {
  userId: string;
}

export interface ChannelDto {
  type: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
  credentials: Record<string, unknown>;
}

export interface QualificationDto {
  budgetMin?: number;
  budgetMax?: number;
  mortgage?: boolean;
  district?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface RealtyListingData {
  operation?: string;
  category?: string;
  price?: number;
  rooms?: number;
  square?: number;
  fullAddress?: string;
  city?: string;
  description?: string;
  mainPhoto?: string;
  photos?: string[];
  options?: Record<string, string>;
}

export interface KnowledgeEntryItem {
  id: string;
  type: string;
  externalId?: string;
  sourceUrl?: string;
  data: RealtyListingData;
}

export interface DataPreviewResponse {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
  entries: KnowledgeEntryItem[];
}
