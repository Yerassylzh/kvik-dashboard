"use client";

import React from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { StepSelectNiche } from "@/components/onboarding/StepSelectNiche";
import { StepBusinessProfile } from "@/components/onboarding/StepBusinessProfile";
import { StepKnowledgeSource } from "@/components/onboarding/StepKnowledgeSource";
import { StepDataPreview } from "@/components/onboarding/StepDataPreview";
import { StepQualification } from "@/components/onboarding/StepQualification";
import { StepConnectChannel } from "@/components/onboarding/StepConnectChannel";
import { StepTelegramAlerts } from "@/components/onboarding/StepTelegramAlerts";
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
    handleSelectNiche,
    handleSubmitBusinessProfile,
    handleScrapingStarted,
    handleConfirmDataSource,
    handleConfirmDataPreview,
    handleSubmitQualification,
    handleChannelStepContinue,
    handleConfirmTelegramAlerts,
    handleSkipTelegramAlerts,
  } = useOnboardingFlow();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
                onContinue={handleConfirmDataSource}
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
            {currentStep === "QUALIFICATION" && (
              <div className="max-w-2xl mx-auto">
                <StepQualification
                  onSubmit={handleSubmitQualification}
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
            {currentStep === "TELEGRAM_ALERTS" && (
              <div className="max-w-3xl mx-auto">
                <StepTelegramAlerts
                  onConfirm={handleConfirmTelegramAlerts}
                  onSkip={handleSkipTelegramAlerts}
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
