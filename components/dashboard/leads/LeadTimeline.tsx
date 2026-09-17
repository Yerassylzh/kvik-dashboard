"use client";

import React, { useState } from "react";
import { Sparkles, User, Activity, ArrowRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLeadTimeline } from "@/hooks/useLeads";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StageChangeActor } from "@/lib/api/leads";

interface LeadTimelineProps {
  leadId: string;
}

export function LeadTimeline({ leadId }: LeadTimelineProps) {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const { events, total, limit, isLoading } = useLeadTimeline(leadId, page);

  const getActorBadge = (actor: StageChangeActor) => {
    switch (actor) {
      case "AI":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-2.5 h-2.5" />
            {t("leads.timeline_actor_ai")}
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <User className="w-2.5 h-2.5" />
            {t("leads.timeline_actor_manager")}
          </span>
        );
      case "SYSTEM":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
            <Activity className="w-2.5 h-2.5" />
            {t("leads.timeline_actor_system")}
          </span>
        );
    }
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        {t("leads.timeline_empty")}
      </div>
    );
  }

  const hasMore = total > page * limit;

  return (
    <div className="space-y-4 py-1">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {events.map((event) => {
          const dateStr = new Date(event.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={event.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-xs space-y-2 hover:border-border transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActorBadge(event.changedBy)}
                    {event.previousStatus ? (
                      <div className="flex items-center gap-1 text-xs">
                        <StatusBadge type="lead" status={event.previousStatus} />
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <StatusBadge type="lead" status={event.newStatus} />
                      </div>
                    ) : (
                      <StatusBadge type="lead" status={event.newStatus} />
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {event.reason && (
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {event.reason}
                  </p>
                )}

                {event.metadata && typeof event.metadata === "object" && Object.keys(event.metadata).length > 0 && (
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-0.5 font-mono">
                    {Object.entries(event.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="capitalize">{k}:</span>
                        <span className="text-foreground truncate max-w-[200px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="pt-2 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            className="text-xs"
          >
            {t("leads.timeline_load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
