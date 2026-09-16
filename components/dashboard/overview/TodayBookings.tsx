"use client";

import React from "react";
import Link from "next/link";
import { Clock, CalendarCheck, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingDto } from "@/lib/api/bookings";

interface TodayBookingsProps {
  bookings?: BookingDto[];
  isLoading?: boolean;
}

export function TodayBookings({ bookings = [], isLoading = false }: TodayBookingsProps) {
  const t = useTranslations("dashboard");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayList = bookings.filter((b) => b.startTime?.startsWith(todayStr)).slice(0, 5);

  return (
    <SectionCard
      title={t("overview.today_bookings_title")}
      description={t("overview.today_bookings_desc")}
      action={
        <Link href="/calendar" className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs text-primary whitespace-nowrap shrink-0"
          >
            {t("nav.calendar")}
          </Button>
        </Link>
      }
      className="h-full"
    >
      <div className="space-y-2 pt-1">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/70"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-2.5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : todayList.length === 0 ? (
          <div className="text-center py-7 text-muted-foreground text-xs">
            <CalendarCheck className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-primary" />
            <p>{t("overview.today_bookings_empty")}</p>
          </div>
        ) : (
          todayList.map((booking) => {
            const time = new Date(booking.startTime).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={booking.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/70 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <EntityAvatar name={booking.clientName} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {booking.clientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {booking.clientPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      <span className="truncate">{booking.serviceName || "Услуга"}</span>
                      {booking.staffName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{booking.staffName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {time}
                    </span>
                    {booking.price && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Number(booking.price).toLocaleString("ru-RU")} ₸
                      </span>
                    )}
                  </div>

                  <StatusBadge status={booking.status} type="booking" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
