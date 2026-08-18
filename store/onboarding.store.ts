import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NicheProfile,
  OnboardingStepState,
  ParsingStatus,
  KnowledgeEntryItem,
  BusinessProfileDto,
} from '@/types/niche';

interface DataPreviewState {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
  entries: KnowledgeEntryItem[];
}

interface OnboardingStoreState {
  step: OnboardingStepState;
  stepIndex: number;
  nicheProfile: NicheProfile | null;

  // Step 1: Business Profile
  businessProfile: BusinessProfileDto;

  // Step 2: Data Source
  krishaUserId: string;

  // Step 3: Data Preview
  dataPreview: DataPreviewState;

  // Actions
  setStepState: (step: OnboardingStepState, stepIndex: number) => void;
  setNicheProfile: (niche: NicheProfile) => void;
  setBusinessProfile: (profile: Partial<BusinessProfileDto>) => void;
  setKrishaUserId: (id: string) => void;
  setDataPreview: (preview: Partial<DataPreviewState>) => void;
  resetOnboarding: () => void;
}

const emptyBusinessProfile: BusinessProfileDto = {
  businessName: '',
  city: '',
  businessPhone: '',
  businessDescription: '',
  websiteUrl: '',
  instagramUrl: '',
  workingHours: '',
};

const emptyDataPreview: DataPreviewState = {
  parsingStatus: 'IDLE',
  parsedCount: 0,
  totalCount: 0,
  failedCount: 0,
  error: undefined,
  entries: [],
};

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set) => ({
      step: 'SELECT_NICHE',
      stepIndex: 0,
      nicheProfile: null,

      businessProfile: { ...emptyBusinessProfile },

      krishaUserId: '',

      dataPreview: { ...emptyDataPreview },

      setStepState: (step, stepIndex) => set({ step, stepIndex }),

      setNicheProfile: (nicheProfile) => set({ nicheProfile }),

      setBusinessProfile: (profile) =>
        set((state) => ({
          businessProfile: { ...state.businessProfile, ...profile },
        })),

      setKrishaUserId: (krishaUserId) => set({ krishaUserId }),

      setDataPreview: (preview) =>
        set((state) => ({
          dataPreview: { ...state.dataPreview, ...preview },
        })),

      resetOnboarding: () =>
        set({
          step: 'SELECT_NICHE',
          stepIndex: 0,
          nicheProfile: null,
          businessProfile: { ...emptyBusinessProfile },
          krishaUserId: '',
          dataPreview: { ...emptyDataPreview },
        }),
    }),
    {
      name: 'kvik-onboarding',
      // Персистим только "ввод пользователя" и текущий шаг.
      // Живые данные парсинга (dataPreview) не храним — они перечитываются с бэкенда.
      partialize: (state) => ({
        step: state.step,
        stepIndex: state.stepIndex,
        nicheProfile: state.nicheProfile,
        businessProfile: state.businessProfile,
        krishaUserId: state.krishaUserId,
      }),
    }
  )
);
