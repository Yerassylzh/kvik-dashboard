"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { useLeadDetail } from "@/hooks/useLeads";
import { DisqualifyDialog } from "./DisqualifyDialog";
import { QualifyDialog } from "./QualifyDialog";
import { LeadTimeline } from "./LeadTimeline";
import { LeadNotes } from "./LeadNotes";
import { LeadDetailHeader } from "./LeadDetailHeader";
import { LeadDetailProfile } from "./LeadDetailProfile";
import type { LeadStatus, LeadLossReason } from "@/lib/api/leads";

interface LeadDetailProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (
    leadId: string,
    status: LeadStatus,
    opts?: { reason?: string; lossReason?: LeadLossReason | null }
  ) => Promise<void> | void;
  onDisqualify?: (leadId: string, lossReason: LeadLossReason, lossNotes?: string) => Promise<void>;
  onQualify?: (leadId: string, payload: { serviceInterest?: string; budget?: number; notes?: string }) => Promise<void>;
  onArchive: (leadId: string) => void;
}

const statusOptions: Array<{ id: LeadStatus; labelKey: string }> = [
  { id: "NEW", labelKey: "leads.stage_new" },
  { id: "APPOINTMENT_SET", labelKey: "leads.stage_appointment" },
  { id: "DEAL_WON", labelKey: "leads.stage_won" },
  { id: "DEAL_LOST", labelKey: "leads.stage_lost" },
];

export function LeadDetail({
  leadId,
  isOpen,
  onClose,
  onStatusChange,
  onDisqualify,
  onQualify,
  onArchive,
}: LeadDetailProps) {
  const t = useTranslations("dashboard");
  const { lead, refresh } = useLeadDetail(leadId);
  const [activeTab, setActiveTab] = useState<"profile" | "timeline" | "notes">("profile");
  const [isDisqualifyOpen, setIsDisqualifyOpen] = useState(false);
  const [isQualifyOpen, setIsQualifyOpen] = useState(false);

  if (!isOpen) return null;

  const handleStageClick = (targetStage: LeadStatus) => {
    if (!lead) return;
    if (targetStage === "DEAL_LOST") {
      setIsDisqualifyOpen(true);
    } else {
      onStatusChange(lead.id, targetStage);
    }
  };

  const handleConfirmDisqualify = async (lossReason: LeadLossReason, lossNotes?: string) => {
    if (!lead) return;
    if (onDisqualify) {
      await onDisqualify(lead.id, lossReason, lossNotes);
    } else {
      await onStatusChange(lead.id, "DEAL_LOST", { lossReason, reason: lossNotes });
    }
    refresh();
  };

  const handleConfirmQualify = async (payload: { serviceInterest?: string; budget?: number; notes?: string }) => {
    if (!lead) return;
    if (onQualify) {
      await onQualify(lead.id, payload);
    } else {
      await onStatusChange(lead.id, "QUALIFIED", { reason: payload.notes });
    }
    refresh();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        variant="panel"
        title={t("leads.detail_title")}
        description="Карточка клиента и история взаимодействий"
      >
        <div className="space-y-5">
          {/* Header Profile & Quick Actions */}
          <LeadDetailHeader
            lead={lead}
            onOpenQualify={() => setIsQualifyOpen(true)}
            onOpenDisqualify={() => setIsDisqualifyOpen(true)}
          />

          {/* Tabs Navigation */}
          <div className="flex border-b border-border/70 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("leads.tab_profile")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("leads.tab_timeline")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === "notes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("leads.tab_notes")}
              {lead?.notes && lead.notes.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-mono">
                  {lead.notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Profile */}
          {activeTab === "profile" && lead && (
            <LeadDetailProfile
              lead={lead}
              statusOptions={statusOptions}
              onStageClick={handleStageClick}
              onArchive={onArchive}
              onRefresh={refresh}
            />
          )}

          {/* Tab 2: Timeline */}
          {activeTab === "timeline" && lead && (
            <LeadTimeline leadId={lead.id} />
          )}

          {/* Tab 3: Notes */}
          {activeTab === "notes" && lead && (
            <LeadNotes
              leadId={lead.id}
              notes={lead.notes}
              onNoteChange={refresh}
            />
          )}
        </div>
      </Modal>

      {/* Disqualify Dialog */}
      <DisqualifyDialog
        isOpen={isDisqualifyOpen}
        onClose={() => setIsDisqualifyOpen(false)}
        onConfirm={handleConfirmDisqualify}
      />

      {/* Qualify Dialog */}
      <QualifyDialog
        isOpen={isQualifyOpen}
        onClose={() => setIsQualifyOpen(false)}
        onConfirm={handleConfirmQualify}
        initialService={(lead?.nicheData as Record<string, unknown> | null)?.serviceInterest as string || ""}
      />
    </>
  );
}


