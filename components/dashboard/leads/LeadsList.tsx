"use client";

import React from "react";
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
              <th className="py-3 px-4 font-semibold">Имя клиента</th>
              <th className="py-3 px-4 font-semibold">Телефон</th>
              <th className="py-3 px-4 font-semibold">Канал</th>
              <th className="py-3 px-4 font-semibold">Статус</th>
              <th className="py-3 px-4 font-semibold">Последняя активность</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {leads.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {t("common.empty_data")}
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
                      <span className="font-semibold text-foreground text-sm">
                        {lead.name || "Без имени"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {lead.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {lead.sourceChannel && meta && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className={meta.color}>
                          <ChannelIcon type={lead.sourceChannel} className="w-4 h-4" />
                        </span>
                        <span>{meta.label}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="lead" status={lead.status} />
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
