"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { BookingDto } from "@/lib/api/bookings";
import clsx from "clsx";

interface BookingCalendarProps {
  bookings: BookingDto[];
  onSelectBooking: (booking: BookingDto) => void;
  onCreateBookingAt?: (date: string) => void;
}

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingCalendar({
  bookings,
  onSelectBooking,
}: BookingCalendarProps) {
  const t = useTranslations("dashboard");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();

  const getBookingsForDay = (d: Date) => {
    const dateStr = localDateKey(d);
    return bookings.filter((b) => b.startTime.startsWith(dateStr));
  };

  const formatWeekTitle = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${format(start, "d", { locale: ru })} — ${format(end, "d MMM yyyy", { locale: ru })}`;
    }
    return `${format(start, "d MMM", { locale: ru })} — ${format(end, "d MMM yyyy", { locale: ru })}`;
  };

  const isCurrentWeek =
    startOfWeek(new Date(), { weekStartsOn: 1 }).toDateString() ===
    weekStart.toDateString();

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs space-y-4 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/50 gap-3">
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-card cursor-pointer"
            aria-label={t("calendar.prev_week")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 text-xs font-semibold text-foreground tabular-nums min-w-[168px] text-center capitalize">
            {formatWeekTitle()}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-card cursor-pointer"
            aria-label={t("calendar.next_week")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!isCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
            className="text-xs h-8 px-2.5"
          >
            {t("calendar.today")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 min-h-[460px]">
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const activeToday = isToday(day);

          return (
            <div
              key={localDateKey(day)}
              className={clsx(
                "flex flex-col rounded-xl border p-2.5 min-h-[160px] sm:min-h-[420px] transition-colors",
                activeToday
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/40 bg-muted/20"
              )}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                <span className="text-xs font-bold text-muted-foreground capitalize">
                  {format(day, "EEE", { locale: ru })}
                </span>
                <span
                  className={clsx(
                    "text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full font-mono tabular-nums",
                    activeToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayBookings.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 py-6">
                    {t("calendar.day_free")}
                  </div>
                ) : (
                  dayBookings.map((b) => {
                    const time = format(new Date(b.startTime), "HH:mm");

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-2 rounded-lg bg-card border border-border/60 hover:border-primary/50 cursor-pointer shadow-2xs text-left transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono tabular-nums">
                          <span className="font-bold text-primary">{time}</span>
                          <span>
                            {t("calendar.duration_min", { n: b.durationMinutes })}
                          </span>
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
