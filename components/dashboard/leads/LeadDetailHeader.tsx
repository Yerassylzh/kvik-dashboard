"use client";

import React from "react";
import { UserCheck, UserX, User, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import type { LeadDetailDto } from "@/lib/api/leads";

interface LeadDetailHeaderProps {
  lead?: LeadDetailDto | null;
  onOpenQualify: () => void;
  onOpenDisqualify: () => void;
}

export function LeadDetailHeader({
  lead,
  onOpenQualify,
  onOpenDisqualify,
}: LeadDetailHeaderProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-4">
      {/* Header Profile */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/40 border border-border/50">
        <EntityAvatar name={lead?.name || "Лид"} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base text-foreground truncate">
              {lead?.name || "Без имени"}
            </h3>
            {typeof lead?.score === "number" && lead.score > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums">
                <Sparkles className="w-2.5 h-2.5" />
                {lead.score}/100
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge type="lead" status={lead?.status || "NEW"} />
            {lead?.sourceChannel && (
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                {lead.sourceChannel}
              </span>
            )}
            {lead?.assignedStaff && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                <User className="w-3 h-3 text-muted-foreground" />
                {lead.assignedStaff.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (Qualify / Disqualify) */}
      <div className="flex items-center gap-2">
        {(lead?.status === "NEW" || lead?.status === "DEAL_LOST") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenQualify}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
            className="flex-1 text-xs font-semibold"
          >
            {t("leads.qualify_btn")}
          </Button>
        )}

        {lead?.status !== "DEAL_LOST" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenDisqualify}
            leftIcon={<UserX className="w-3.5 h-3.5 text-rose-500" />}
            className="flex-1 text-xs font-semibold"
          >
            {t("leads.disqualify_btn")}
          </Button>
        )}
      </div>
    </div>
  );
}
