"use client";

import React from "react";
import { UserX, User, Sparkles, CalendarCheck2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import type { LeadDetailDto } from "@/lib/api/leads";

interface LeadDetailHeaderProps {
  lead?: LeadDetailDto | null;
  onOpenQualify?: () => void;
  onOpenDisqualify: () => void;
}

export function LeadDetailHeader({
  lead,
  onOpenDisqualify,
}: LeadDetailHeaderProps) {
  const t = useTranslations("dashboard");

  const totalBookings = lead?.totalBookingsCount ?? lead?.bookings?.length ?? 0;
  const noShowCount = lead?.noShowCount ?? 0;

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

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge type="lead" status={lead?.status || "NEW"} />

            {/* Total Bookings Chip */}
            {totalBookings > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground border border-border/60 font-mono tabular-nums">
                <CalendarCheck2 className="w-3 h-3 text-primary" />
                {t("leads.total_bookings_label", { count: totalBookings })}
              </span>
            )}

            {/* No-show Warning Chip */}
            {noShowCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 font-mono tabular-nums">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                {t("leads.noshow_count_label", { count: noShowCount })}
              </span>
            )}

            {lead?.sourceChannel && (
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                {lead.sourceChannel}
              </span>
            )}

            {lead?.assignedStaff && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                <User className="w-3 h-3 text-muted-foreground" />
                <span>
                  {lead.assignedStaff.role
                    ? `${lead.assignedStaff.name} (${lead.assignedStaff.role})`
                    : lead.assignedStaff.name}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (Disqualify) */}
      <div className="flex items-center gap-2">
        {lead?.status !== "DEAL_LOST" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenDisqualify}
            leftIcon={<UserX className="w-3.5 h-3.5 text-rose-500" />}
            className="w-full text-xs font-semibold"
          >
            {t("leads.disqualify_btn")}
          </Button>
        )}
      </div>
    </div>
  );
}
