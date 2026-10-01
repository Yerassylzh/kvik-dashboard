"use client";

import React, { useState } from "react";
import { Filter, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFollowUpLogs } from "@/hooks/useFollowUps";
import { FollowUpLogStatusBadge } from "./FollowUpLogStatusBadge";
import { FollowUpMessageModal } from "./FollowUpMessageModal";
import type {
  FollowUpLogItem,
  FollowUpLogStatus,
} from "@/lib/api/followUps";
import type { ChannelType } from "@/types/channels";

interface FollowUpLogsTabProps {
  workspaceId?: string;
}

export function FollowUpLogsTab({ workspaceId }: FollowUpLogsTabProps) {
  const t = useTranslations("dashboard");
  const [statusFilter, setStatusFilter] = useState<FollowUpLogStatus | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<ChannelType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<FollowUpLogItem | null>(null);

  const { logs, total, limit, isLoading } = useFollowUpLogs(
    workspaceId,
    {
      status: statusFilter === "ALL" ? undefined : statusFilter,
      channelType: channelFilter === "ALL" ? undefined : channelFilter,
      page,
      limit: 20,
    }
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <Filter className="w-4 h-4 text-muted-foreground" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">{t("automations.logs_filter_all_status")}</option>
            <option value="PENDING">{t("automations.status_pending")}</option>
            <option value="SENT">{t("automations.status_sent")}</option>
            <option value="REPLIED">{t("automations.status_replied")}</option>
            <option value="SKIPPED">{t("automations.status_skipped")}</option>
            <option value="CANCELLED">{t("automations.status_cancelled")}</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value as typeof channelFilter);
              setPage(1);
            }}
            className="text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">{t("automations.logs_filter_all_channels")}</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TELEGRAM">Telegram</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {t("automations.logs_total_records")} <strong>{total}</strong>
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">{t("automations.logs_col_date")}</th>
                <th className="py-3 px-4">{t("automations.logs_col_lead")}</th>
                <th className="py-3 px-4">{t("automations.logs_col_step")}</th>
                <th className="py-3 px-4">{t("automations.logs_col_status")}</th>
                <th className="py-3 px-4">{t("automations.logs_col_message")}</th>
                <th className="py-3 px-4 text-right">{t("automations.logs_col_result")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t("automations.logs_loading")}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t("automations.logs_empty")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = log.executedAt
                    ? new Date(log.executedAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(log.scheduledFor).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 font-medium text-foreground">
                        <div>{log.lead?.name || t("automations.logs_lead_default")}</div>
                        {log.lead?.phone && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {log.lead.phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground">
                          {t("automations.logs_step_prefix", { step: log.stepIndex })}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5 uppercase">
                          ({log.channelType})
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <FollowUpLogStatusBadge status={log.status} />
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="truncate text-muted-foreground">
                          {log.messageText || "—"}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.convertedToBooking ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" />
                            {t("automations.logs_badge_booking")}
                          </span>
                        ) : log.status === "REPLIED" ? (
                          <span className="text-[11px] text-primary font-medium">
                            {t("automations.logs_badge_replied")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 px-4 border-t border-border/70 bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              {t("automations.logs_page_indicator", { page, total: totalPages })}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <FollowUpMessageModal
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
