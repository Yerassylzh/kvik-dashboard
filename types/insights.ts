export type RecommendationStatus = 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'IMPLEMENTED' | 'ALL';

export type InsightCategory =
  | 'SERVICE_EXPANSION'
  | 'SCHEDULE_OPTIMIZATION'
  | 'PRICING_AND_PACKAGING'
  | 'KNOWLEDGE_GAP'
  | 'STAFF_BALANCING'
  | 'MARKETING_INSIGHT';

export type InsightImpact = 'HIGH' | 'MEDIUM' | 'LOW';

export type RecommendationActionType =
  | 'ADD_SERVICE_OFFERING'
  | 'UPDATE_SCHEDULE_HOURS'
  | 'ADD_KNOWLEDGE_NOTE'
  | 'UPDATE_PROMPT_RULE'
  | 'MANUAL_ACTION_REQUIRED';

export type DismissalReasonCode =
  | 'NOT_APPLICABLE_TO_NICHE'
  | 'BUSINESS_DECISION_NO'
  | 'ALREADY_RESOLVED_OFFLINE'
  | 'INCORRECT_EXTRACTION'
  | 'OTHER';

export interface SampleQuoteDto {
  quote: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | string;
  date: string;
}

export interface RecommendationItemDto {
  id: string;
  category: InsightCategory;
  impact: InsightImpact;
  status: RecommendationStatus;
  title: string;
  executiveSummary: string;
  problemDiagnosis: string;
  uniqueClientsCount: number;
  lostLeadsCount: number;
  lostRevenueScore?: number;
  sampleQuotes: SampleQuoteDto[];
  actionType: RecommendationActionType;
  actionPayload: Record<string, unknown>;
  createdAt: string;
}

export interface RecommendationsListResponseDto {
  data: RecommendationItemDto[];
  total: number;
  page: number;
  limit: number;
}

export interface RecommendationsSummaryResponseDto {
  totalActive: number;
  highImpactCount: number;
  mediumImpactCount: number;
  lowImpactCount: number;
  estimatedLostLeadsTotal: number;
  categoryBreakdown: Partial<Record<InsightCategory, number>>;
}

export interface UnmetServiceItemDto {
  service: string;
  inquiries: number;
  lostLeads: number;
}

export interface HourlyDistributionItemDto {
  hour: number;
  inquiries: number;
  isWorkingHour: boolean;
}

export interface TopObjectionItemDto {
  reason: string;
  count: number;
  percentage: number;
}

export interface DemandTrendsResponseDto {
  period: {
    from: string;
    to: string;
  };
  unmetServices: UnmetServiceItemDto[];
  hourlyInquiryDistribution: HourlyDistributionItemDto[];
  topObjections: TopObjectionItemDto[];
}

export interface ReportRecommendationSnippetDto {
  id: string;
  category: InsightCategory;
  impact: InsightImpact;
  status: RecommendationStatus;
  title: string;
  uniqueClientsCount: number;
}

export interface WeeklyReportItemDto {
  id: string;
  periodStart: string;
  periodEnd: string;
  weekLabel: string;
  totalLeadsAnalyzed: number;
  totalInsightsFound: number;
  highImpactCount: number;
  totalLostLeads: number;
  recommendations: ReportRecommendationSnippetDto[];
  generatedAt: string;
}

export interface ReportsListResponseDto {
  data: WeeklyReportItemDto[];
  total: number;
  page: number;
  limit: number;
}

export interface SingleWeeklyReportResponseDto extends WeeklyReportItemDto {
  markdownContent: string;
}

export interface ApplyRecommendationPayload {
  customizedPayload?: Record<string, unknown>;
}

export interface DismissRecommendationPayload {
  reasonCode: DismissalReasonCode;
  feedbackNotes?: string;
  suppressPermanently?: boolean;
}
