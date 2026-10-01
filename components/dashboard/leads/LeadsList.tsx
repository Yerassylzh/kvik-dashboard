"use client";

import React from "react";
import { User, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { ChannelIcon } from "@/components/ui/channel-icon";
import type { LeadDto } from "@/lib/api/leads";

interface LeadsListProps {
  leads: LeadDto[];
  onSelectLead: (lead: LeadDto) => void;
  isLoading?: boolean;
}

const channelMeta: Record<string, { label: string; color: string }> = {
  WHATSAPP: { label: "WhatsApp", color: "text-emerald-500" },
  INSTAGRAM: { label: "Instagram", color: "text-pink-500" },
  TELEGRAM: { label: "Telegram", color: "text-sky-500" },
};

export function LeadsList({ leads, onSelectLead, isLoading }: LeadsListProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
              <th className="py-3 px-4 font-semibold">{t("leads.name_label")}</th>
              <th className="py-3 px-4 font-semibold">{t("leads.phone_label")}</th>
              <th className="py-3 px-4 font-semibold">Канал</th>
              <th className="py-3 px-4 font-semibold">{t("leads.assigned_staff")}</th>
              <th className="py-3 px-4 font-semibold">Статус</th>
              <th className="py-3 px-4 font-semibold">{t("leads.last_activity")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {leads.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  {t("leads.timeline_empty")}
                </td>
              </tr>
            )}

            {leads.map((lead) => {
              const meta = lead.sourceChannel ? channelMeta[lead.sourceChannel] : null;
              const formattedDate = lead.lastActivityAt
                ? new Date(lead.lastActivityAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={lead.name || "Лид"} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs truncate">
                            {lead.name || "Без имени"}
                          </span>
                          {typeof lead.score === "number" && lead.score > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary font-mono tabular-nums">
                              <Sparkles className="w-2.5 h-2.5" />
                              {lead.score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {lead.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {lead.sourceChannel && meta && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className={meta.color}>
                          <ChannelIcon type={lead.sourceChannel} className="w-3.5 h-3.5" />
                        </span>
                        <span>{meta.label}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {lead.assignedStaff ? (
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <User className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px]">{lead.assignedStaff.name}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge type="lead" status={lead.status} />
                      {lead.status === "DEAL_LOST" && lead.lossReason && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[140px]">
                          {t(`leads.loss_reason_${lead.lossReason}` as Parameters<typeof t>[0])}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                    {formattedDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

