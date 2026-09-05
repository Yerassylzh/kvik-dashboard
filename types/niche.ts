/**
 * Onboarding & niche types.
 *
 * Contract source: dev_docs/backend/019_MOVING_NICHE_FOCUS_TO_CALENDAR.md + openapi.json.
 * Calendar-based verticals only (Beauty, Clinic, Fitness, Consulting, Other).
 * Realty / Auto verticals are DEPRECATED — see dev_docs/Product Architecture.md.
 */

// ---------------------------------------------------------------------------
// Niches (calendar businesses only)
// ---------------------------------------------------------------------------

export type NicheProfile =
  | "BEAUTY"
  | "CLINIC"
  | "FITNESS"
  | "CONSULTING"
  | "OTHER_CALENDAR";

export type OnboardingStepState =
  | "SELECT_NICHE"
  | "BUSINESS_PROFILE"
  | "DATA_SOURCE"
  | "DATA_PREVIEW"
  | "CONNECT_CHANNEL"
  | "QUALIFICATION"
  | "COMPLETE_TEST"
  | "DONE";

export type ParsingStatus =
  | "IDLE"
  | "QUEUED"
  | "PROCESSING"
  | "DONE"
  | "FAILED";

export type ScrapingType = "2gis" | "website";

export type IngestOption = ScrapingType | "documents" | "notes";

// ---------------------------------------------------------------------------
// Onboarding state
// ---------------------------------------------------------------------------

export interface OnboardingStateResponse {
  step: OnboardingStepState;
  stepIndex: number;
  completed: boolean;
  parsingStatus?: ParsingStatus;
  parsedCount?: number;
  totalCount?: number;
  failedCount?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Step 0: Niche
// ---------------------------------------------------------------------------

export interface SelectNicheDto {
  nicheProfile: NicheProfile;
}

// ---------------------------------------------------------------------------
// Step 1: Business profile
// ---------------------------------------------------------------------------

export interface BusinessProfileDto {
  country: string;
  businessName: string;
  city: string;
  businessPhone?: string;
  businessAddress?: string;
  workingHours?: string;
  businessDescription?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

// ---------------------------------------------------------------------------
// Step 2: Knowledge base ingestion
// ---------------------------------------------------------------------------

export interface TwoGisScrapingDto {
  input: string;
}

export interface WebsiteScrapingDto {
  websiteUrl: string;
}

export interface KnowledgeNotesDto {
  notes: string[];
}

/**
 * Response of GET /onboarding/scraping/status?type=2gis|website.
 * The backend does not pin the exact shape yet, so optional fields
 * cover both the "status" and legacy "parsingStatus" naming.
 */
export interface ScrapingStatusResponse {
  status?: ParsingStatus | string;
  parsingStatus?: ParsingStatus;
  parsedCount?: number;
  totalCount?: number;
  failedCount?: number;
  error?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Step 3: Knowledge base preview & confirmation
// ---------------------------------------------------------------------------

export type KnowledgeEntryType =
  | "LOCAL_LISTING"
  | "WEBSITE_CONTENT"
  | "DOCUMENT"
  | "MANUAL_NOTE";

export type KnowledgeProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeEntryType | string;
  title?: string | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  fileKey?: string | null;
  fileMimeType?: string | null;
  fileSize?: number | null;
  processingStatus?: KnowledgeProcessingStatus | string;
  active?: boolean;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataPreviewResponse {
  entries: KnowledgeEntry[];
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
}

export interface KnowledgeEntriesResponse {
  entries: KnowledgeEntry[];
  total: number;
  limit: number;
  offset: number;
}

/** AI-extracted Layer 2 business summary (GET /onboarding/business-context). */
export interface BusinessContext {
  businessType?: string | null;
  specialization?: string | null;
  keyDifferentiators?: string[];
  servicesOffered?: string[];
  pricingPolicy?: string | null;
  restrictions?: string[];
  teamSummary?: string | null;
  bookingPolicy?: string | null;
  cancellationPolicy?: string | null;
  contactInfo?: string | null;
  workingHours?: string | null;
}

// ---------------------------------------------------------------------------
// Step 4: Messaging channel
// ---------------------------------------------------------------------------

export interface ChannelDto {
  type: "WHATSAPP" | "INSTAGRAM" | "TELEGRAM";
  credentials: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Step 5: Qualification rules
// ---------------------------------------------------------------------------

export interface QualificationDto {
  questions: string[];
  customInstructions?: string;
}

// ---------------------------------------------------------------------------
// DEPRECATED legacy shapes — kept ONLY so components in components/**/_legacy/
// keep compiling. Never use in active code.
// ---------------------------------------------------------------------------

/** @deprecated Realty (Krisha.kz) vertical is deprecated. */
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

/** @deprecated Auto sales (Kolesa.kz) vertical is deprecated. */
export interface AutoListingData {
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  bodyType?: string;
  engineVolume?: number;
  transmission?: string;
  city?: string;
  description?: string;
  mainPhoto?: string;
  photos?: string[];
  options?: Record<string, string>;
}

/** @deprecated Use KnowledgeEntry instead. */
export interface KnowledgeEntryItem {
  id: string;
  type: string;
  externalId?: string;
  sourceUrl?: string;
  data: RealtyListingData & AutoListingData & Record<string, unknown>;
}

/** @deprecated Direct listing crawl (Krisha/Kolesa user ID) is deprecated. */
export interface DataSourceDto {
  userId: string;
}

/** @deprecated Direct listing crawl (Krisha/Kolesa user ID) is deprecated. */
export interface DataSourceResponseDto extends OnboardingStateResponse {
  code: string;
  message: string;
  isRaw?: boolean;
}
