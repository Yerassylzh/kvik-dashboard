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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { useRBAC } from "@/hooks/useRBAC";
import { KbStatsHeader } from "./KbStatsHeader";
import { KbDocumentsTab } from "./KbDocumentsTab";
import { KbNotesTab } from "./KbNotesTab";
import { KbWebsiteScraperTab } from "./KbWebsiteScraperTab";
import { KbTwoGisScraperTab } from "./KbTwoGisScraperTab";
import { KbQualificationTab } from "./KbQualificationTab";
import { KbSearchTesterModal } from "./KbSearchTesterModal";
import { KbCautionModal } from "./KbCautionModal";
import { BusinessContextManager } from "@/components/dashboard/settings/business-context/BusinessContextManager";
import { AgentConfig } from "@/components/dashboard/settings/ai-agent/AgentConfig";
import { SegmentedTabs } from "@/components/ui/tabs";

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
  const { isAdminOrOwner } = useRBAC();
  const [isSearchTesterOpen, setIsSearchTesterOpen] = useState(false);
  const [isCautionOpen, setIsCautionOpen] = useState(false);

  useEffect(() => {
    if (!isAdminOrOwner) {
      router.replace("/overview");
    }
  }, [isAdminOrOwner, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && isAdminOrOwner) {
      const acknowledged = localStorage.getItem("kvik_kb_caution_acknowledged");
      if (!acknowledged) {
        setIsCautionOpen(true);
      }
    }
  }, [isAdminOrOwner]);

  const handleConfirmCaution = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kvik_kb_caution_acknowledged", "true");
    }
    setIsCautionOpen(false);
  };

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

  const mainTabs = [
    {
      id: "sources" as MainTab,
      label: t("knowledge.tab_sources"),
      icon: <FileText className="w-3.5 h-3.5 text-primary" />,
      count: (documents.length || 0) + (notes.length || 0),
    },
    {
      id: "business-context" as MainTab,
      label: t("settings.nav_business_context"),
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
    },
    {
      id: "qualification" as MainTab,
      label: t("knowledge.tab_qualification"),
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
      id: "ai-agent" as MainTab,
      label: t("settings.nav_ai"),
      icon: <Bot className="w-3.5 h-3.5 text-primary" />,
    },
  ];

  const sourceTabs = [
    {
      id: "documents" as SourceSubTab,
      label: t("knowledge.docs_title"),
      icon: <FileText className="w-3.5 h-3.5" />,
      count: documents.length,
    },
    {
      id: "notes" as SourceSubTab,
      label: t("knowledge.notes_title"),
      icon: <StickyNote className="w-3.5 h-3.5" />,
      count: notes.length,
    },
    {
      id: "website" as SourceSubTab,
      label: t("knowledge.website_title"),
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      id: "twogis" as SourceSubTab,
      label: t("knowledge.twogis_title"),
      icon: <MapPin className="w-3.5 h-3.5" />,
    },
  ];

  if (!isAdminOrOwner) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Stats Header */}
      <KbStatsHeader
        stats={stats}
        isLoading={isStatsLoading}
        onOpenSearchTester={() => setIsSearchTesterOpen(true)}
      />

      {/* Level 1 Main Navigation */}
      <SegmentedTabs
        tabs={mainTabs}
        activeTab={activeMainTab}
        onChange={handleTabChange}
        className="w-full sm:w-full"
      />

      {/* 1. Sources Tab Content */}
      {activeMainTab === "sources" && (
        <div className="space-y-4">
          {/* Source Sub-Tabs */}
          <SegmentedTabs
            tabs={sourceTabs}
            activeTab={activeSourceTab}
            onChange={handleSubtabChange}
          />

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

      {/* First-visit Caution Modal */}
      <KbCautionModal
        isOpen={isCautionOpen}
        onConfirm={handleConfirmCaution}
        onGoBack={() => router.push("/overview")}
      />
    </div>
  );
}
