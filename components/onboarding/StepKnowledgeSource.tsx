"use client";

import React, { useState } from "react";
import { ScrapingType } from "@/types/niche";
import {
  KnowledgeSourceDraft,
  DataPreviewState,
} from "@/store/onboarding.store";
import { Stage2gis } from "./knowledge/Stage2gis";
import { StageWebsite } from "./knowledge/StageWebsite";
import { StageDocuments } from "./knowledge/StageDocuments";
import { StageNotes } from "./knowledge/StageNotes";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface StepKnowledgeSourceProps {
  draft: KnowledgeSourceDraft;
  defaultProfileWebsite?: string;
  dataPreview: DataPreviewState;
  onDraftChange: (draft: Partial<KnowledgeSourceDraft>) => void;
  onScrapingStarted: (type: ScrapingType) => void;
  onContinue: () => void;
  onBack?: () => void;
  loading: boolean;
}

const SOURCES = [
  { id: 0, key: "twogis", icon: "📍", label: "2GIS" },
  { id: 1, key: "website", icon: "🌐", label: "Веб-сайт" },
  { id: 2, key: "documents", icon: "📄", label: "Документы" },
  { id: 3, key: "notes", icon: "📝", label: "Заметки" },
];

export function StepKnowledgeSource({
  draft,
  defaultProfileWebsite,
  dataPreview: _dataPreview,
  onDraftChange,
  onScrapingStarted,
  onContinue,
  onBack,
  loading: _loading,
}: StepKnowledgeSourceProps) {
  const [activeTab, setActiveTab] = useState<number>(draft.activeStage ?? 0);

  const handleSelectTab = (tabId: number) => {
    setActiveTab(tabId);
    onDraftChange({ activeStage: tabId });
  };

  const is2gisConnected =
    draft.twoGisStatus === "STARTED" || draft.twoGisStatus === "COMPLETED";
  const isWebsiteConnected =
    draft.websiteStatus === "STARTED" || draft.websiteStatus === "COMPLETED";
  const hasDocuments = (draft.uploadedFiles?.length ?? 0) > 0;
  const hasNotes = (draft.savedNotes?.length ?? 0) > 0;

  const hasAnySource =
    is2gisConnected || isWebsiteConnected || hasDocuments || hasNotes;

  const handleRemoveFile = (index: number) => {
    const updated = (draft.uploadedFiles || []).filter((_, i) => i !== index);
    onDraftChange({ uploadedFiles: updated });
  };

  const handleRemoveNote = (index: number) => {
    const updated = (draft.savedNotes || []).filter((_, i) => i !== index);
    onDraftChange({ savedNotes: updated });
  };

  return (
    <div className="space-y-6">
      {/* Modern Minimal Source Tabs */}
      <FadeIn delay={0.05} className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border">
          {SOURCES.map((source) => {
            const isActive = activeTab === source.id;
            let isConnected = false;
            if (source.id === 0 && is2gisConnected) isConnected = true;
            if (source.id === 1 && isWebsiteConnected) isConnected = true;
            if (source.id === 2 && hasDocuments) isConnected = true;
            if (source.id === 3 && hasNotes) isConnected = true;

            return (
              <button
                key={source.id}
                type="button"
                onClick={() => handleSelectTab(source.id)}
                className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
              >
                <span>{source.icon}</span>
                <span className="truncate">{source.label}</span>
                {isConnected && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </FadeIn>

      {/* Active Source Panel */}
      <div className="min-h-[18rem] p-6 rounded-2xl bg-card/60 border border-border">
        {activeTab === 0 && (
          <Stage2gis
            inputUrl={draft.twoGisInput}
            status={draft.twoGisStatus}
            parsedCount={draft.twoGisCount}
            onChangeUrl={(val) => onDraftChange({ twoGisInput: val })}
            onStatusChange={(status, count) => {
              onDraftChange({ twoGisStatus: status, twoGisCount: count });
              if (status === "STARTED") onScrapingStarted("2gis");
            }}
            onNext={() => handleSelectTab(1)}
            onBack={onBack}
          />
        )}

        {activeTab === 1 && (
          <StageWebsite
            inputUrl={draft.websiteUrl}
            defaultProfileUrl={defaultProfileWebsite}
            status={draft.websiteStatus}
            parsedCount={draft.websiteCount}
            onChangeUrl={(val) => onDraftChange({ websiteUrl: val })}
            onStatusChange={(status, count) => {
              onDraftChange({ websiteStatus: status, websiteCount: count });
              if (status === "STARTED") onScrapingStarted("website");
            }}
            onNext={() => handleSelectTab(2)}
            onPrev={() => handleSelectTab(0)}
          />
        )}

        {activeTab === 2 && (
          <StageDocuments
            uploadedFiles={draft.uploadedFiles || []}
            onAddUploadedFile={(file) => {
              const files = [...(draft.uploadedFiles || []), file];
              onDraftChange({ uploadedFiles: files });
            }}
            onRemoveUploadedFile={handleRemoveFile}
            onNext={() => handleSelectTab(3)}
            onPrev={() => handleSelectTab(1)}
          />
        )}

        {activeTab === 3 && (
          <StageNotes
            savedNotes={draft.savedNotes || []}
            onAddNote={(note) => {
              const notes = [...(draft.savedNotes || []), note];
              onDraftChange({ savedNotes: notes });
            }}
            onRemoveNote={handleRemoveNote}
            onNext={onContinue}
            onPrev={() => handleSelectTab(2)}
            hasAnySource={hasAnySource}
          />
        )}
      </div>
    </div>
  );
}
