"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { RecommendationItemDto } from "@/types/insights";
import { Calendar, ShieldCheck } from "lucide-react";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { ChannelType } from "@/types/channels";
import { useTranslations } from "next-intl";

interface QuotesProofDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RecommendationItemDto | null;
}

export function QuotesProofDrawer({ isOpen, onClose, recommendation }: QuotesProofDrawerProps) {
  const t = useTranslations("insights");

  if (!recommendation) return null;

  const quotes = recommendation.sampleQuotes || [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto themed-scroll flex flex-col p-6">
        <SheetHeader className="space-y-1.5 pb-4 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-[11px]">
              {t("quotes.proof_badge")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("quotes.clients_count", { count: recommendation.uniqueClientsCount })}
            </span>
          </div>
          <SheetTitle className="text-base font-bold text-foreground leading-snug">
            {recommendation.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t("quotes.drawer_desc")}
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="py-4 space-y-3.5 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t("quotes.privacy_notice")}</span>
          </div>

          {quotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/20">
              {t("quotes.processing")}
            </div>
          ) : (
            quotes.map((q, idx) => {
              const channelType = (q.channel?.toUpperCase() || "WHATSAPP") as ChannelType;
              const formattedDate = q.date ? new Date(q.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }) : t("quotes.date_recent");

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border/80 bg-card/60 shadow-2xs space-y-2 hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <ChannelIcon type={channelType} className="w-4 h-4" />
                      <span className="text-[11px]">{channelType}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground leading-relaxed italic">
                    «{q.quote}»
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
