"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  CalendarDays,
  List as ListIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSelector } from "@/components/dashboard/bookings/StaffSelector";
import { BookingCalendar } from "@/components/dashboard/bookings/BookingCalendar";
import { BookingList } from "@/components/dashboard/bookings/BookingList";
import { BookingDetail } from "@/components/dashboard/bookings/BookingDetail";
import { CreateBookingModal } from "@/components/dashboard/bookings/CreateBookingModal";
import { RescheduleModal } from "@/components/dashboard/bookings/RescheduleModal";
import { SchedulePage } from "@/components/dashboard/schedule/SchedulePage";
import { CalendarMatrixView } from "./CalendarMatrixView";
import { useBookings } from "@/hooks/useBookings";
import { useStaff } from "@/hooks/useStaff";
import type { BookingDto } from "@/lib/api/bookings";

type CalendarTab = "matrix" | "month" | "list" | "schedule";

export function CalendarPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<CalendarTab>("matrix");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingDto | null>(null);

  const { bookings, isLoading, createBooking, updateStatus, reschedule } = useBookings({
    staffId: selectedStaffId,
  });

  const { staff } = useStaff(true);
  const activeStaff = staff.filter((s) => !selectedStaffId || s.id === selectedStaffId);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header & Contextual Tabs */}
      <DashboardPageHeader
        title={t("calendar.title")}
        description={t("calendar.desc")}
        badge={<Badge variant="primary">{bookings.length}</Badge>}
        actions={
          activeTab !== "schedule" ? (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date navigation */}
              <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="px-2 py-1 text-xs font-medium hover:bg-muted rounded-md text-foreground cursor-pointer"
                >
                  {t("calendar.today")} ({format(selectedDate, "d MMM, EEE", { locale: ru })})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Create Booking Button */}
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {t("calendar.new_booking")}
              </Button>
            </div>
          ) : undefined
        }
        tabs={[
          {
            id: "matrix",
            label: t("calendar.view_matrix"),
            icon: LayoutGrid,
            active: activeTab === "matrix",
            onClick: () => setActiveTab("matrix"),
          },
          {
            id: "month",
            label: t("calendar.view_month"),
            icon: CalendarDays,
            active: activeTab === "month",
            onClick: () => setActiveTab("month"),
          },
          {
            id: "list",
            label: t("calendar.view_list"),
            icon: ListIcon,
            count: bookings.length,
            active: activeTab === "list",
            onClick: () => setActiveTab("list"),
          },
          {
            id: "schedule",
            label: t("calendar.tab_schedule"),
            icon: Clock,
            active: activeTab === "schedule",
            onClick: () => setActiveTab("schedule"),
          },
        ]}
      />

      {/* Booking Calendar Canvas Views */}
      {activeTab !== "schedule" && (
        <div className="space-y-4">
          <StaffSelector
            staffList={staff}
            selectedStaffId={selectedStaffId}
            onSelect={setSelectedStaffId}
          />

          {activeTab === "matrix" && (
            <CalendarMatrixView
              activeStaff={activeStaff}
              bookings={bookings}
              onSelectBooking={setSelectedBookingId}
            />
          )}

          {activeTab === "month" && (
            <BookingCalendar
              bookings={bookings}
              onSelectBooking={(b) => setSelectedBookingId(b.id)}
            />
          )}

          {activeTab === "list" && (
            <BookingList
              bookings={bookings}
              onSelectBooking={(b) => setSelectedBookingId(b.id)}
              isLoading={isLoading}
            />
          )}

          {/* Booking Detail Modal / Slide-Over */}
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
          {rescheduleBooking && (
            <RescheduleModal
              booking={rescheduleBooking}
              isOpen={Boolean(rescheduleBooking)}
              onClose={() => setRescheduleBooking(null)}
              onReschedule={(id, startTime, durationMinutes) =>
                reschedule(id, { startTime, durationMinutes })
              }
            />
          )}
        </div>
      )}

      {/* Tab 4: Clinic Operating Hours & Schedule */}
      {activeTab === "schedule" && <SchedulePage />}
    </div>
  );
}
