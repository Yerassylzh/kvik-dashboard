"use client";

import React from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { StepSelectNiche } from "@/components/onboarding/StepSelectNiche";
import { StepBusinessProfile } from "@/components/onboarding/StepBusinessProfile";
import { StepKnowledgeSource } from "@/components/onboarding/StepKnowledgeSource";
import { StepDataPreview } from "@/components/onboarding/StepDataPreview";
import { StepConnectChannel } from "@/components/onboarding/StepConnectChannel";
import { StepQualification } from "@/components/onboarding/StepQualification";
import { StepCompleteTest } from "@/components/onboarding/StepCompleteTest";
import { StepTransition } from "@/components/ui/motion/StepTransition";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

export default function OnboardingPage() {
  const {
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
    handleConfirmDataPreview,
    handleChannelStepContinue,
    handleSubmitQualification,
    handleComplete,
  } = useOnboardingFlow();

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
