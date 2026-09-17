"use client";

import React, { useState } from "react";
import { Calendar, CalendarX } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { bookingsApi } from "@/lib/api/bookings";
import type { LeadDetailDto } from "@/lib/api/leads";

interface LeadProfileBookingsProps {
  bookings?: LeadDetailDto["bookings"];
  onRefresh: () => void;
}

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

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {t("leads.detail_bookings")}
      </h4>
      {!bookings || bookings.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Записей пока нет</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3 rounded-xl bg-card border border-border/50 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {booking.serviceName || "Услуга"}
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
                </div>
                <StatusBadge type="booking" status={booking.status as any} />
              </div>

              {/* No-show action button for confirmed bookings */}
              {booking.status === "CONFIRMED" && (
                <div className="pt-2 border-t border-border/40 flex justify-end">
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
  );
}
