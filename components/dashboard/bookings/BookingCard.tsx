"use client";

import React from "react";
import { Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import type { BookingDto } from "@/lib/api/bookings";

interface BookingCardProps {
  booking: BookingDto;
  onSelect: (booking: BookingDto) => void;
}

export function BookingCard({ booking, onSelect }: BookingCardProps) {
  const t = useTranslations("dashboard");

  const startTime = new Date(booking.startTime).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(booking.endTime).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = new Date(booking.startTime).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <InteractiveCard
      onClick={() => onSelect(booking)}
      className="p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-xs cursor-pointer space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <EntityAvatar name={booking.clientName} size="md" />
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-foreground truncate">
              {booking.clientName}
            </h4>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {booking.clientPhone}
            </p>
          </div>
        </div>

        <StatusBadge type="booking" status={booking.status} />
      </div>

      <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground truncate">
            {booking.serviceName || "Услуга"}
          </span>
          {booking.price && (
            <span className="font-mono font-bold text-foreground shrink-0">
              {Number(booking.price).toLocaleString("ru-RU")} {t("common.currency")}
            </span>
          )}
        </div>

        {booking.staffName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Мастер: {booking.staffName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>
            {startTime} – {endTime}
          </span>
        </div>
        <span className="text-[11px] font-mono">{dateStr}</span>
      </div>
    </InteractiveCard>
  );
}
