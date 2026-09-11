"use client";

import React, { useState } from "react";
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { StaffSelector } from "./StaffSelector";
import { BookingCalendar } from "./BookingCalendar";
import { BookingList } from "./BookingList";
import { BookingDetail } from "./BookingDetail";
import { CreateBookingModal } from "./CreateBookingModal";
import { RescheduleModal } from "./RescheduleModal";
import { useBookings } from "@/hooks/useBookings";
import { useStaff } from "@/hooks/useStaff";
import type { BookingDto } from "@/lib/api/bookings";
import clsx from "clsx";

interface BookingsPageProps {
  initialBookingId?: string;
}

export function BookingsPage({ initialBookingId }: BookingsPageProps) {
  const t = useTranslations("dashboard");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    initialBookingId || null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingDto | null>(null);

  const { bookings, isLoading, createBooking, updateStatus, reschedule } = useBookings({
    staffId: selectedStaffId,
  });

  const { staff } = useStaff(true);

  return (
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6">
      <PageHeader
        title={t("bookings.title")}
        description={t("bookings.desc")}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={clsx(
                  "p-1.5 rounded-lg text-xs transition-all",
                  viewMode === "calendar"
                    ? "bg-background text-foreground shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("bookings.view_calendar")}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={clsx(
                  "p-1.5 rounded-lg text-xs transition-all",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("bookings.view_list")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>{t("bookings.new_booking_btn")}</span>
            </Button>
          </div>
        }
      />

      <StaffSelector
        staffList={staff}
        selectedStaffId={selectedStaffId}
        onSelect={setSelectedStaffId}
      />

      {viewMode === "calendar" ? (
        <BookingCalendar
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBookingId(b.id)}
        />
      ) : (
        <BookingList
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBookingId(b.id)}
          isLoading={isLoading}
        />
      )}

      {/* Booking Detail Modal */}
      <BookingDetail
        bookingId={selectedBookingId}
        isOpen={Boolean(selectedBookingId)}
        onClose={() => setSelectedBookingId(null)}
        onStatusChange={updateStatus}
        onOpenReschedule={(b) => setRescheduleBooking(b)}
      />

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        staffList={staff}
        onCreate={createBooking}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        booking={rescheduleBooking}
        isOpen={Boolean(rescheduleBooking)}
        onClose={() => setRescheduleBooking(null)}
        onReschedule={(id, startTime, durationMinutes) =>
          reschedule(id, { startTime, durationMinutes })
        }
      />
    </FadeIn>
  );
}
