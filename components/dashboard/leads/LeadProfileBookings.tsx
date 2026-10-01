"use client";

import React, { useState } from "react";
import { Calendar, CalendarX, Sparkles, User, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { bookingsApi, type BookingStatus } from "@/lib/api/bookings";
import type { LeadDetailDto } from "@/lib/api/leads";

interface LeadProfileBookingsProps {
  bookings?: LeadDetailDto["bookings"];
  onRefresh: () => void;
}

const ACTIVE_STATUSES = new Set(["CONFIRMED", "PENDING", "RESCHEDULED", "CREATED"]);

export function LeadProfileBookings({ bookings, onRefresh }: LeadProfileBookingsProps) {
  const t = useTranslations("dashboard");
  const [noShowLoadingId, setNoShowLoadingId] = useState<string | null>(null);

  const handleNoShow = async (bookingId: string) => {
    if (!window.confirm(t("leads.noshow_confirm"))) return;
    setNoShowLoadingId(bookingId);
    try {
      await bookingsApi.markNoShow(bookingId);
      toast.success(t("leads.noshow_toast"));
      onRefresh();
    } catch {
      // Handled by axios interceptor
    } finally {
      setNoShowLoadingId(null);
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("inbox.upcoming_appointments_title")}
        </h4>
        <div className="p-3.5 rounded-xl bg-card border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">{t("inbox.no_upcoming_appointments")}</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) => ACTIVE_STATUSES.has(b.status));
  const pastBookings = bookings.filter((b) => !ACTIVE_STATUSES.has(b.status));

  return (
    <div className="space-y-4">
      {/* 1. Upcoming / Active Appointments Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{t("inbox.upcoming_appointments_title")}</span>
          </h4>
          {upcomingBookings.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary font-mono tabular-nums">
              {upcomingBookings.length}
            </span>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
            <p className="text-xs text-muted-foreground">{t("inbox.no_upcoming_appointments")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3.5 rounded-xl bg-card border border-border/80 shadow-xs space-y-2.5 transition-all hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {booking.serviceName || t("inbox.appointment_service")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>
                          {new Date(booking.startTime).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {booking.staffName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{booking.staffName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <StatusBadge type="booking" status={booking.status as BookingStatus} />
                </div>

                {/* No-show action button for confirmed bookings */}
                {booking.status === "CONFIRMED" && (
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {t("inbox.appointment_booked_by_ai")}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNoShow(booking.id)}
                      disabled={noShowLoadingId === booking.id}
                      loading={noShowLoadingId === booking.id}
                      leftIcon={<CalendarX className="w-3 h-3 text-rose-500" />}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-7 px-2"
                    >
                      {t("leads.noshow_btn")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Past Bookings History (if any) */}
      {pastBookings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("inbox.past_appointments_title")}
          </h4>
          <div className="space-y-2">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between gap-2 text-xs opacity-80"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {booking.serviceName || t("inbox.appointment_service")}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {new Date(booking.startTime).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {booking.staffName && ` · ${booking.staffName}`}
                  </div>
                </div>
                <StatusBadge type="booking" status={booking.status as BookingStatus} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
