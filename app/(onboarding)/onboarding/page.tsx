"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getOnboardingState,
  selectNicheStep,
  submitBusinessProfile,
  getDataPreview,
  confirmDataPreview,
  submitChannel,
  confirmChannelStep,
  submitQualification,
  completeOnboarding,
} from "@/lib/api/onboarding";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  NicheProfile,
  OnboardingStateResponse,
  BusinessProfileDto,
  ChannelDto,
  QualificationDto,
} from "@/types/niche";

import { StepSelectNiche } from "@/components/onboarding/StepSelectNiche";
import { StepBusinessProfile } from "@/components/onboarding/StepBusinessProfile";
import { StepKnowledgeSource } from "@/components/onboarding/StepKnowledgeSource";
import { StepDataPreview } from "@/components/onboarding/StepDataPreview";
import { StepConnectChannel } from "@/components/onboarding/StepConnectChannel";
import { StepQualification } from "@/components/onboarding/StepQualification";
import { StepCompleteTest } from "@/components/onboarding/StepCompleteTest";
import { StepTransition } from "@/components/ui/motion/StepTransition";
import {
  OnboardingHeader,
  STEP_META,
} from "@/components/onboarding/OnboardingHeader";
import { useToast } from "@/components/ui/toast/ToastContext";

export default function OnboardingPage() {
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

  const applyState = (res: OnboardingStateResponse): boolean => {
    if (res.step === "DONE") {
      router.replace("/");
      return true;
    }
    const newIndex = STEP_META[res.step]?.index ?? 0;
    setDirection(newIndex >= prevStepIdxRef.current ? 1 : -1);
    prevStepIdxRef.current = newIndex;

    const store = useOnboardingStore.getState();
    if (res.step === "SELECT_NICHE") {
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
  };

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
            : "Ошибка загрузки состояния онбординга";
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling for parsing status during knowledge base steps (every 3 seconds)
  useEffect(() => {
    const isKnowledgeActive =
      currentStep === "DATA_SOURCE" || currentStep === "DATA_PREVIEW";
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
            e.processingStatus === "PENDING" ||
            e.processingStatus === "PROCESSING"
        );
        const isGlobalParsing =
          res.parsingStatus === "QUEUED" || res.parsingStatus === "PROCESSING";

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

  // Step Handlers
  const handleSelectNiche = async (niche: NicheProfile) => {
    try {
      setActionLoading(true);
      setError(null);
      useOnboardingStore.getState().setNicheProfile(niche);
      applyState(await selectNicheStep({ nicheProfile: niche }));
      toast.success("Сфера бизнеса сохранена");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка сохранения ниши";
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
      toast.success("Профиль бизнеса успешно сохранён");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ошибка сохранения профиля";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScrapingStarted = () => {
    useOnboardingStore.getState().setDataPreview({
      parsingStatus: "PROCESSING",
      error: undefined,
    });
  };

  // Confirm knowledge base and advance to CONNECT_CHANNEL (Step 5)
  const handleConfirmDataPreview = async () => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await confirmDataPreview());
      toast.success("База знаний подтверждена");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ошибка подтверждения данных";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Called when user clicks "Continue" in StepConnectChannel after ≥1 channel
   * is connected. Advances the onboarding state machine to the next step.
   * Individual channel connections are handled inside StepConnectChannel itself
   * via the /channels/* API endpoints.
   */
  const handleChannelStepContinue = async () => {
    try {
      setActionLoading(true);
      setError(null);
      // Advance the step — actual credentials are already
      // persisted by the individual /channels/* connect calls.
      applyState(await confirmChannelStep());
      toast.success("Канал связи успешно подключён");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ошибка подключения канала";
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
      toast.success("Правила квалификации сохранены");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ошибка сохранения правил квалификации";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await completeOnboarding();
      toast.success("🎉 Онбординг завершен! Ассистент активирован.");
      if (!applyState(res)) {
        applyState(await getOnboardingState());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка активации бота";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Загрузка данных онбординга...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <OnboardingHeader currentStep={currentStep} error={error} />

      {/* Open, Unboxed Step Content Container (Consistent max-w-4xl, no width jumps) */}
      <div className="w-full">
        <StepTransition stepKey={currentStep} direction={direction}>
          <div className="w-full">
            {currentStep === "SELECT_NICHE" && (
              <StepSelectNiche
                onSelect={handleSelectNiche}
                loading={actionLoading}
              />
            )}
            {currentStep === "BUSINESS_PROFILE" && (
              <div className="max-w-2xl mx-auto">
                <StepBusinessProfile
                  initialValues={businessProfile}
                  onSubmit={handleSubmitBusinessProfile}
                  loading={actionLoading}
                />
              </div>
            )}
            {currentStep === "DATA_SOURCE" && (
              <StepKnowledgeSource
                draft={knowledgeSource}
                defaultProfileWebsite={businessProfile.websiteUrl}
                dataPreview={dataPreview}
                onDraftChange={useOnboardingStore.getState().setKnowledgeSource}
                onScrapingStarted={handleScrapingStarted}
                onContinue={() => goToStep("DATA_PREVIEW", 3, 1)}
                loading={actionLoading}
              />
            )}
            {currentStep === "DATA_PREVIEW" && (
              <div className="max-w-3xl mx-auto">
                <StepDataPreview
                  dataPreview={dataPreview}
                  onConfirm={handleConfirmDataPreview}
                  loading={actionLoading}
                />
              </div>
            )}
            {currentStep === "CONNECT_CHANNEL" && (
              <div className="max-w-4xl mx-auto">
                <StepConnectChannel
                  onContinue={handleChannelStepContinue}
                  continueLoading={actionLoading}
                />
              </div>
            )}
            {currentStep === "QUALIFICATION" && (
              <div className="max-w-2xl mx-auto">
                <StepQualification
                  onSubmit={handleSubmitQualification}
                  loading={actionLoading}
                />
              </div>
            )}
            {currentStep === "COMPLETE_TEST" && (
              <div className="max-w-2xl mx-auto">
                <StepCompleteTest
                  onComplete={handleComplete}
                  loading={actionLoading}
                />
              </div>
            )}
          </div>
        </StepTransition>
      </div>
    </div>
  );
}
