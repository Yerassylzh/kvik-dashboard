import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getOnboardingState,
  selectNicheStep,
  submitBusinessProfile,
  confirmDataSourceStep,
  getDataPreview,
  confirmDataPreview,
  confirmChannelStep,
  submitQualification,
  completeOnboarding,
} from '@/lib/api/onboarding';
// Note: completeOnboarding is called automatically after qualification — the test step is removed.
import { useOnboardingStore } from '@/store/onboarding.store';
import {
  NicheProfile,
  OnboardingStateResponse,
  BusinessProfileDto,
  QualificationDto,
} from '@/types/niche';
import { STEP_META } from '@/components/onboarding/OnboardingHeader';
import { useToast } from '@/components/ui/toast/ToastContext';

export function useOnboardingFlow() {
  const router = useRouter();
  const toast = useToast();
  const currentStep = useOnboardingStore((s) => s.step);
  const businessProfile = useOnboardingStore((s) => s.businessProfile);
  const knowledgeSource = useOnboardingStore((s) => s.knowledgeSource);
  const dataPreview = useOnboardingStore((s) => s.dataPreview);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const prevStepIdxRef = useRef(0);

  const applyState = useCallback(
    (res: OnboardingStateResponse): boolean => {
      if (res.step === 'DONE') {
        router.replace('/');
        return true;
      }
      // COMPLETE_TEST step is removed from UI — auto-complete immediately
      if (res.step === 'COMPLETE_TEST') {
        completeOnboarding()
          .then(() => router.replace('/'))
          .catch(() => router.replace('/'));
        return true;
      }
      const newIndex = STEP_META[res.step]?.index ?? 0;
      setDirection(newIndex >= prevStepIdxRef.current ? 1 : -1);
      prevStepIdxRef.current = newIndex;

      const store = useOnboardingStore.getState();
      if (res.step === 'SELECT_NICHE') {
        store.resetOnboarding();
      }
      store.setStepState(res.step, newIndex);

      if (res.parsingStatus) {
        store.setDataPreview({
          parsingStatus: res.parsingStatus,
          parsedCount: res.parsedCount ?? 0,
          totalCount: res.totalCount ?? 0,
          failedCount: res.failedCount ?? 0,
          error: res.error,
        });
      }
      return false;
    },
    [router]
  );

  // Initial load runs strictly once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stateRes = await getOnboardingState();
        if (cancelled) return;
        applyState(stateRes);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Ошибка загрузки состояния онбординга';
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState, toast]);

  // Polling for parsing status during knowledge base steps (every 3 seconds)
  useEffect(() => {
    const isKnowledgeActive =
      currentStep === 'DATA_SOURCE' || currentStep === 'DATA_PREVIEW';
    if (!isKnowledgeActive) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const res = await getDataPreview();
        if (cancelled) return;

        useOnboardingStore.getState().setDataPreview({
          parsingStatus: res.parsingStatus,
          parsedCount: res.parsedCount,
          totalCount: res.totalCount,
          failedCount: res.failedCount ?? 0,
          error: res.error,
          entries: res.entries || [],
        });

        const hasPendingEntries = (res.entries || []).some(
          (e) =>
            e.processingStatus === 'PENDING' ||
            e.processingStatus === 'PROCESSING'
        );
        const isGlobalParsing =
          res.parsingStatus === 'QUEUED' || res.parsingStatus === 'PROCESSING';

        if (!isGlobalParsing && !hasPendingEntries) {
          if (interval) clearInterval(interval);
        }
      } catch {
        // Silent catch for background polling
      }
    };

    tick();
    interval = setInterval(tick, 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [currentStep]);

  // Step Navigation Helpers
  const goToStep = (step: typeof currentStep, index: number, dir: 1 | -1) => {
    setDirection(dir);
    prevStepIdxRef.current = index;
    useOnboardingStore.getState().setStepState(step, index);
  };

  const handleSelectNiche = async (niche: NicheProfile) => {
    try {
      setActionLoading(true);
      setError(null);
      useOnboardingStore.getState().setNicheProfile(niche);
      applyState(await selectNicheStep({ nicheProfile: niche }));
      toast.success('Сфера бизнеса сохранена');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения ниши';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitBusinessProfile = async (data: BusinessProfileDto) => {
    try {
      setActionLoading(true);
      setError(null);
      useOnboardingStore.getState().setBusinessProfile(data);
      applyState(await submitBusinessProfile(data));
      toast.success('Профиль бизнеса успешно сохранён');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка сохранения профиля';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScrapingStarted = () => {
    useOnboardingStore.getState().setDataPreview({
      parsingStatus: 'PROCESSING',
      error: undefined,
    });
  };

  const handleConfirmDataSource = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const stateRes = await confirmDataSourceStep();
      applyState(stateRes);
      toast.success('Источники данных сохранены');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ошибка сохранения источников данных';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDataPreview = async () => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await confirmDataPreview());
      toast.success('База знаний подтверждена');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка подтверждения данных';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChannelStepContinue = async () => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await confirmChannelStep());
      toast.success('Канал связи успешно подключён');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка подключения канала';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQualification = async (data: QualificationDto) => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await submitQualification(data));
      toast.success('Правила квалификации сохранены');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ошибка сохранения правил квалификации';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // handleComplete removed — completeOnboarding() is called automatically in applyState
  // when backend transitions to COMPLETE_TEST, skipping the test UI step.

  return {
    currentStep,
    businessProfile,
    knowledgeSource,
    dataPreview,
    loading,
    actionLoading,
    error,
    direction,
    goToStep,
    handleSelectNiche,
    handleSubmitBusinessProfile,
    handleScrapingStarted,
    handleConfirmDataSource,
    handleConfirmDataPreview,
    handleChannelStepContinue,
    handleSubmitQualification,
  };
}
