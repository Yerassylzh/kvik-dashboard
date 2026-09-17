"use client";

import React from "react";
import {
  Phone,
  Mail,
  Archive,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LeadProfileBookings } from "./LeadProfileBookings";
import { LeadProfileConversations } from "./LeadProfileConversations";
import { LeadProfileNicheData } from "./LeadProfileNicheData";
import type { LeadDetailDto, LeadStatus } from "@/lib/api/leads";

interface LeadDetailProfileProps {
  lead: LeadDetailDto;
  statusOptions: Array<{ id: LeadStatus; labelKey: string }>;
  onStageClick: (targetStage: LeadStatus) => void;
  onArchive: (leadId: string) => void;
  onRefresh: () => void;
}

export function LeadDetailProfile({
  lead,
  statusOptions,
  onStageClick,
  onArchive,
  onRefresh,
}: LeadDetailProfileProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-5">
      {/* Status Switcher */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Этап воронки
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStageClick(opt.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                lead.status === opt.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {t(opt.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Loss details if DEAL_LOST */}
      {lead.status === "DEAL_LOST" && (
        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t("leads.loss_reason_label")}</span>
          </div>
          <div className="text-xs text-foreground font-semibold">
            {lead.lossReason ? t(`leads.loss_reason_${lead.lossReason}` as any) : "Не указана"}
          </div>
          {lead.lossNotes && (
            <div className="text-xs text-muted-foreground mt-1">
              {lead.lossNotes}
            </div>
          )}
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("leads.detail_contact")}
        </h4>
        <div className="space-y-1.5 text-xs">
          {lead.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/50">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-foreground font-medium">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/50">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">{lead.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Niche Data / Service Interest */}
      <LeadProfileNicheData nicheData={lead.nicheData} />

      {/* Linked Conversations */}
      <LeadProfileConversations conversations={lead.conversations} />

      {/* Linked Bookings */}
      <LeadProfileBookings bookings={lead.bookings} onRefresh={onRefresh} />

      {/* Archive / Delete Lead */}
      <div className="pt-3 border-t border-border/50">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onArchive(lead.id)}
          leftIcon={<Archive className="w-3.5 h-3.5" />}
          className="w-full text-xs font-semibold"
        >
          {t("leads.archive_btn")}
        </Button>
      </div>
    </div>
  );
}

