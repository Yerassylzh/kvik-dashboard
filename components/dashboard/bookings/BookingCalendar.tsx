"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { BookingDto } from "@/lib/api/bookings";
import clsx from "clsx";

interface BookingCalendarProps {
  bookings: BookingDto[];
  onSelectBooking: (booking: BookingDto) => void;
  onCreateBookingAt?: (date: string) => void;
}

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function BookingCalendar({
  bookings,
  onSelectBooking,
  onCreateBookingAt,
}: BookingCalendarProps) {
  const t = useTranslations("dashboard");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Compute 7 days for the selected week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    // Monday as start of week (0=Sun, 1=Mon)
    const currentDay = d.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    d.setDate(d.getDate() + diffToMonday + currentWeekOffset * 7 + i);
    return d;
  });

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const getBookingsForDay = (d: Date) => {
    const dateStr = d.toISOString().split("T")[0];
    return bookings.filter((b) => b.startTime.startsWith(dateStr));
  };

  const formatWeekTitle = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} — ${end.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs space-y-4 p-4">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <h3 className="font-bold text-sm sm:text-base text-foreground capitalize">
          {formatWeekTitle()}
        </h3>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(0)}
            className="text-xs h-8 px-2.5"
          >
            Сегодня
          </Button>
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((p) => p - 1)}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((p) => p + 1)}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 min-h-[460px]">
        {weekDays.map((day, idx) => {
          const dayBookings = getBookingsForDay(day);
          const activeToday = isToday(day);
          const dateIso = day.toISOString().split("T")[0];

          return (
            <div
              key={idx}
              className={clsx(
                "flex flex-col rounded-xl border p-2.5 min-h-[160px] sm:min-h-[420px] transition-colors",
                activeToday
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/40 bg-muted/20"
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {dayNames[idx]}
                </span>
                <span
                  className={clsx(
                    "text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full font-mono",
                    activeToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Day Slots */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayBookings.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 py-6">
                    Свободно
                  </div>
                ) : (
                  dayBookings.map((b) => {
                    const time = new Date(b.startTime).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-2 rounded-lg bg-card border border-border/60 hover:border-primary/50 cursor-pointer shadow-2xs text-left transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="font-bold text-primary">{time}</span>
                          <span>{b.durationMinutes} мин</span>
                        </div>
                        <div className="font-semibold text-xs text-foreground truncate">
                          {b.clientName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {b.serviceName}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
