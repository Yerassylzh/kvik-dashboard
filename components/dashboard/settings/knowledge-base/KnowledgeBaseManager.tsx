"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  FileText,
  StickyNote,
  Globe,
  MapPin,
  UserCheck,
  Sparkles,
  Bot,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { KbStatsHeader } from "./KbStatsHeader";
import { KbDocumentsTab } from "./KbDocumentsTab";
import { KbNotesTab } from "./KbNotesTab";
import { KbWebsiteScraperTab } from "./KbWebsiteScraperTab";
import { KbTwoGisScraperTab } from "./KbTwoGisScraperTab";
import { KbQualificationTab } from "./KbQualificationTab";
import { KbSearchTesterModal } from "./KbSearchTesterModal";
import { BusinessContextManager } from "@/components/dashboard/settings/business-context/BusinessContextManager";
import { AgentConfig } from "@/components/dashboard/settings/ai-agent/AgentConfig";

type MainTab = "sources" | "business-context" | "qualification" | "ai-agent";
type SourceSubTab = "documents" | "notes" | "website" | "twogis";

export function KnowledgeBaseManager() {
  const t = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabQuery = searchParams.get("tab") as MainTab | null;
  const subtabQuery = searchParams.get("subtab") as SourceSubTab | null;

  const [activeMainTab, setActiveMainTab] = useState<MainTab>(
    tabQuery && ["sources", "business-context", "qualification", "ai-agent"].includes(tabQuery)
      ? tabQuery
      : "sources"
  );
  const [activeSourceTab, setActiveSourceTab] = useState<SourceSubTab>(
    subtabQuery && ["documents", "notes", "website", "twogis"].includes(subtabQuery)
      ? subtabQuery
      : "documents"
  );
  const [isSearchTesterOpen, setIsSearchTesterOpen] = useState(false);

  useEffect(() => {
    if (tabQuery && ["sources", "business-context", "qualification", "ai-agent"].includes(tabQuery)) {
      setActiveMainTab(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    if (subtabQuery && ["documents", "notes", "website", "twogis"].includes(subtabQuery)) {
      setActiveSourceTab(subtabQuery);
    }
  }, [subtabQuery]);

  const handleTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const handleSubtabChange = (subtab: SourceSubTab) => {
    setActiveSourceTab(subtab);
    router.replace(`${pathname}?tab=sources&subtab=${subtab}`, { scroll: false });
  };

  const {
    stats,
    isStatsLoading,
    documents,
    isDocsLoading,
    notes,
    isNotesLoading,
    scrapersStatus,
    isScrapersLoading,
    qualificationData,
    isQualificationLoading,
    isSearching,
    searchResults,
    searchError,
    runSearchTest,
    clearSearch,
    refreshAll,
  } = useKnowledgeBase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Compact Stats Header */}
      <KbStatsHeader
        stats={stats}
        isLoading={isStatsLoading}
        onOpenSearchTester={() => setIsSearchTesterOpen(true)}
      />

      {/* Level 1 Main Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/60 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => handleTabChange("sources")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeMainTab === "sources"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>{t("knowledge.tab_sources")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
            {(documents.length || 0) + (notes.length || 0)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("business-context")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeMainTab === "business-context"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t("settings.nav_business_context")}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-500 font-mono font-bold">
            L2
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("qualification")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeMainTab === "qualification"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t("knowledge.tab_qualification")}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("ai-agent")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0",
            activeMainTab === "ai-agent"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span>{t("settings.nav_ai")}</span>
        </button>
      </div>

      {/* 1. Sources Tab Content */}
      {activeMainTab === "sources" && (
        <div className="space-y-4">
          {/* Source Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleSubtabChange("documents")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0",
                activeSourceTab === "documents"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t("knowledge.docs_title")}</span>
              <span className={clsx(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-1",
                activeSourceTab === "documents" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
              )}>
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubtabChange("notes")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0",
                activeSourceTab === "notes"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>{t("knowledge.notes_title")}</span>
              <span className={clsx(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-1",
                activeSourceTab === "notes" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
              )}>
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubtabChange("website")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0",
                activeSourceTab === "website"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t("knowledge.website_title")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubtabChange("twogis")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0",
                activeSourceTab === "twogis"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t("knowledge.twogis_title")}</span>
            </button>
          </div>

          {/* Sub-tab view */}
          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
            {activeSourceTab === "documents" && (
              <KbDocumentsTab
                documents={documents}
                isLoading={isDocsLoading}
                onRefresh={refreshAll}
              />
            )}

            {activeSourceTab === "notes" && (
              <KbNotesTab
                notes={notes}
                isLoading={isNotesLoading}
                onRefresh={refreshAll}
              />
            )}

            {activeSourceTab === "website" && (
              <KbWebsiteScraperTab
                status={scrapersStatus?.website}
                isLoading={isScrapersLoading}
                onRefresh={refreshAll}
              />
            )}

            {activeSourceTab === "twogis" && (
              <KbTwoGisScraperTab
                status={scrapersStatus?.twoGis}
                isLoading={isScrapersLoading}
                onRefresh={refreshAll}
              />
            )}
          </div>
        </div>
      )}

      {/* 2. Layer 2 Business Context Tab */}
      {activeMainTab === "business-context" && (
        <BusinessContextManager />
      )}

      {/* 3. Qualification Tab Content */}
      {activeMainTab === "qualification" && (
        <KbQualificationTab
          initialData={qualificationData}
          isLoading={isQualificationLoading}
          onRefresh={refreshAll}
        />
      )}

      {/* 4. AI Agent Configuration Tab */}
      {activeMainTab === "ai-agent" && (
        <AgentConfig />
      )}

      {/* Search Sandbox Modal */}
      <KbSearchTesterModal
        isOpen={isSearchTesterOpen}
        onClose={() => {
          setIsSearchTesterOpen(false);
          clearSearch();
        }}
        isSearching={isSearching}
        results={searchResults}
        error={searchError}
        onSearch={runSearchTest}
      />
    </div>
  );
}
