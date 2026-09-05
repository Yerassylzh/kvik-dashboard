import { create } from "zustand";
import {
  IngestOption,
  NicheProfile,
  OnboardingStepState,
  ParsingStatus,
  KnowledgeEntry,
  BusinessProfileDto,
} from "@/types/niche";

export interface DataPreviewState {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
  entries: KnowledgeEntry[];
}

export type ScrapingStatusType =
  | "IDLE"
  | "STARTED"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface KnowledgeSourceDraft {
  option: IngestOption | null;
  activeStage?: number;
  twoGisInput: string;
  twoGisStatus?: ScrapingStatusType;
  twoGisCount?: number;
  websiteUrl: string;
  websiteStatus?: ScrapingStatusType;
  websiteCount?: number;
  note: string;
  savedNotes?: string[];
  uploadedFiles?: Array<{ name: string; size: number }>;
}

interface OnboardingStoreState {
  step: OnboardingStepState;
  stepIndex: number;
  nicheProfile: NicheProfile | null;
  businessProfile: BusinessProfileDto;
  knowledgeSource: KnowledgeSourceDraft;
  dataPreview: DataPreviewState;

  setStepState: (step: OnboardingStepState, stepIndex: number) => void;
  setNicheProfile: (niche: NicheProfile) => void;
  setBusinessProfile: (profile: Partial<BusinessProfileDto>) => void;
  setKnowledgeSource: (draft: Partial<KnowledgeSourceDraft>) => void;
  setDataPreview: (preview: Partial<DataPreviewState>) => void;
  resetOnboarding: () => void;
}

const emptyBusinessProfile: BusinessProfileDto = {
  country: "KZ",
  businessName: "",
  city: "",
  businessPhone: "",
  businessAddress: "",
  businessDescription: "",
  websiteUrl: "",
  instagramUrl: "",
  workingHours: "",
};

const emptyKnowledgeSource: KnowledgeSourceDraft = {
  option: null,
  activeStage: 0,
  twoGisInput: "",
  twoGisStatus: "IDLE",
  twoGisCount: 0,
  websiteUrl: "",
  websiteStatus: "IDLE",
  websiteCount: 0,
  note: "",
  savedNotes: [],
  uploadedFiles: [],
};

const emptyDataPreview: DataPreviewState = {
  parsingStatus: "IDLE",
  parsedCount: 0,
  totalCount: 0,
  failedCount: 0,
  error: undefined,
  entries: [],
};

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  step: "SELECT_NICHE",
  stepIndex: 0,
  nicheProfile: null,
  businessProfile: { ...emptyBusinessProfile },
  knowledgeSource: { ...emptyKnowledgeSource },
  dataPreview: { ...emptyDataPreview },

  setStepState: (step, stepIndex) => set({ step, stepIndex }),
  setNicheProfile: (nicheProfile) => set({ nicheProfile }),
  setBusinessProfile: (profile) =>
    set((state) => ({
      businessProfile: { ...state.businessProfile, ...profile },
    })),
  setKnowledgeSource: (draft) =>
    set((state) => ({
      knowledgeSource: { ...state.knowledgeSource, ...draft },
    })),
  setDataPreview: (preview) =>
    set((state) => ({
      dataPreview: { ...state.dataPreview, ...preview },
    })),
  resetOnboarding: () =>
    set({
      step: "SELECT_NICHE",
      stepIndex: 0,
      nicheProfile: null,
      businessProfile: { ...emptyBusinessProfile },
      knowledgeSource: { ...emptyKnowledgeSource },
      dataPreview: { ...emptyDataPreview },
    }),
}));
