"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BookingDto } from "@/lib/api/bookings";
import type { StaffDto } from "@/lib/api/staff";

interface CalendarMatrixViewProps {
  activeStaff: StaffDto[];
  bookings: BookingDto[];
  onSelectBooking: (bookingId: string) => void;
}

export function CalendarMatrixView({
  activeStaff,
  bookings,
  onSelectBooking,
}: CalendarMatrixViewProps) {
  const t = useTranslations("dashboard");

  if (activeStaff.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border border-dashed border-border/80 rounded-2xl bg-card space-y-3">
        <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mx-auto">
          <Users className="w-5 h-5" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-sm font-bold text-foreground">
            {t("calendar.no_staff_title")}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("calendar.no_staff_desc")}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/team">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              {t("calendar.btn_add_staff")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {activeStaff.map((member) => {
        const staffBookings = bookings.filter((b) => b.staffId === member.id);
        return (
          <div
            key={member.id}
            className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card space-y-3"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-semibold text-xs">
                  {member.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.role || t("calendar.specialist_fallback")}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {staffBookings.length}
              </Badge>
            </div>

            <div className="space-y-1.5 min-h-[100px]">
              {staffBookings.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-4 text-[11px] text-muted-foreground/70">
                  {t("calendar.empty_slots")}
                </div>
              ) : (
                staffBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking(b.id)}
                    className="p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground font-mono">
                        {b.startTime ? format(new Date(b.startTime), "HH:mm") : "00:00"}
                      </span>
                      <Badge
                        variant={
                          b.status === "CONFIRMED"
                            ? "success"
                            : b.status === "PENDING"
                            ? "warning"
                            : "default"
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {b.clientName || "Клиент"}
                    </p>
                    {b.serviceName && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {b.serviceName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
