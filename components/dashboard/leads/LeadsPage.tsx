"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { LeadFilters } from "./LeadFilters";
import { LeadsKanban } from "./LeadsKanban";
import { LeadsList } from "./LeadsList";
import { LeadDetail } from "./LeadDetail";
import { useLeads } from "@/hooks/useLeads";
import type { LeadDto, ChannelType, LeadStatus } from "@/lib/api/leads";

interface LeadsPageProps {
  initialLeadId?: string;
}

export function LeadsPage({ initialLeadId }: LeadsPageProps) {
  const t = useTranslations("dashboard");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelType | undefined>();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);

  const {
    leads,
    counts,
    isLoading,
    setSearch: applySearch,
    setSourceChannel,
    updateLeadStatus,
    archiveLead,
  } = useLeads({
    search: search || undefined,
    sourceChannel: channel,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    applySearch(val);
  };

  const handleChannelChange = (ch?: ChannelType) => {
    setChannel(ch);
    setSourceChannel(ch);
  };

  return (
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6">
      <PageHeader
        title={t("leads.title")}
        description={t("leads.desc")}
      />

      <LeadFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={handleSearchChange}
        selectedChannel={channel}
        onChannelChange={handleChannelChange}
      />

      {viewMode === "kanban" ? (
        <LeadsKanban
          leads={leads}
          counts={counts}
          onSelectLead={(lead) => setSelectedLeadId(lead.id)}
          onMoveStage={updateLeadStatus}
        />
      ) : (
        <LeadsList
          leads={leads}
          onSelectLead={(lead) => setSelectedLeadId(lead.id)}
          isLoading={isLoading}
        />
      )}

      <LeadDetail
        leadId={selectedLeadId}
        isOpen={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
        onStatusChange={updateLeadStatus}
        onArchive={archiveLead}
      />
    </FadeIn>
  );
}
