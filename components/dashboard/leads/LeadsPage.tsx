"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { LeadFilters, type ViewMode } from "./LeadFilters";
import { LeadsKanban } from "./LeadsKanban";
import { LeadsList } from "./LeadsList";
import { LeadsFunnel } from "./LeadsFunnel";
import { LeadDetail } from "./LeadDetail";
import { useLeads } from "@/hooks/useLeads";
import type { ChannelType, LeadLossReason } from "@/lib/api/leads";

interface LeadsPageProps {
  initialLeadId?: string;
}

export function LeadsPage({ initialLeadId }: LeadsPageProps) {
  const t = useTranslations("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelType | undefined>();
  const [lossReason, setLossReason] = useState<LeadLossReason | undefined>();
  const [sortBy, setSortBy] = useState<"lastActivityAt" | "createdAt" | "stageChangedAt" | "score">("lastActivityAt");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);

  const {
    leads,
    counts,
    isLoading,
    setSearch: applySearch,
    setSourceChannel,
    setLossReason: applyLossReason,
    setSort,
    updateLeadStatus,
    disqualifyLead,
    qualifyLead,
    archiveLead,
  } = useLeads({
    search: search || undefined,
    sourceChannel: channel,
    lossReason: lossReason,
    sortBy: sortBy,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    applySearch(val);
  };

  const handleChannelChange = (ch?: ChannelType) => {
    setChannel(ch);
    setSourceChannel(ch);
  };

  const handleLossReasonChange = (reason?: LeadLossReason) => {
    setLossReason(reason);
    applyLossReason(reason);
  };

  const handleSortChange = (newSort: "lastActivityAt" | "createdAt" | "stageChangedAt" | "score") => {
    setSortBy(newSort);
    setSort(newSort, "desc");
  };

  return (
    <FadeIn direction="up" distance={10} duration={0.2} className="space-y-4 sm:space-y-5">
      <div className="pb-3 border-b border-border/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            {t("clients.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("clients.desc")}
          </p>
        </div>

        <LeadFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          search={search}
          onSearchChange={handleSearchChange}
          selectedChannel={channel}
          onChannelChange={handleChannelChange}
          selectedLossReason={lossReason}
          onLossReasonChange={handleLossReasonChange}
          sortBy={sortBy}
          onSortByChange={handleSortChange}
        />
      </div>

      {viewMode === "kanban" && (
        <LeadsKanban
          leads={leads}
          counts={counts}
          onSelectLead={(lead) => setSelectedLeadId(lead.id)}
          onMoveStage={updateLeadStatus}
        />
      )}

      {viewMode === "list" && (
        <LeadsList
          leads={leads}
          onSelectLead={(lead) => setSelectedLeadId(lead.id)}
          isLoading={isLoading}
        />
      )}

      {viewMode === "funnel" && (
        <LeadsFunnel />
      )}

      <LeadDetail
        leadId={selectedLeadId}
        isOpen={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
        onStatusChange={updateLeadStatus}
        onDisqualify={disqualifyLead}
        onQualify={qualifyLead}
        onArchive={archiveLead}
      />
    </FadeIn>
  );
}

