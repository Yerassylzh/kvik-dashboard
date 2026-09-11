"use client";

import React, { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/ui/channel-icon";

interface ChannelStatusItem {
  id: "WHATSAPP" | "INSTAGRAM" | "TELEGRAM";
  name: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  accountInfo?: string;
  color: string;
  bg: string;
}

export function ChannelsManager() {
  const t = useTranslations("dashboard");

  const [channels, setChannels] = useState<ChannelStatusItem[]>([
    {
      id: "WHATSAPP",
      name: "WhatsApp Business API",
      status: "CONNECTED",
      accountInfo: "+7 (701) 555-0199 • Official Cloud API",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      id: "INSTAGRAM",
      name: "Instagram Direct",
      status: "CONNECTED",
      accountInfo: "@afrodita_beauty_salon",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      id: "TELEGRAM",
      name: "Telegram Bot",
      status: "CONNECTED",
      accountInfo: "@AfroditaSalonBot",
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
  ]);

  return (
    <SectionCard
      title="Подключенные каналы связи"
      description="Статус интеграций с мессенджерами для приема сообщений и автоответов"
      className="max-w-3xl"
    >
      <div className="space-y-3 pt-2">
        {channels.map((ch) => {
          return (
            <div
              key={ch.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`p-3 rounded-xl ${ch.bg} ${ch.color}`}>
                  <ChannelIcon type={ch.id} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">{ch.name}</h4>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Подключен</span>
                    </span>
                  </div>
                  {ch.accountInfo && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                      {ch.accountInfo}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Проверить</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
