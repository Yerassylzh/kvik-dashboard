"use client";

import React, { useState } from "react";
import { Clock, UserCheck, CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { StaffSelector } from "@/components/dashboard/bookings/StaffSelector";
import { BookingCalendar } from "@/components/dashboard/bookings/BookingCalendar";
import { BookingList } from "@/components/dashboard/bookings/BookingList";
import { BookingDetail } from "@/components/dashboard/bookings/BookingDetail";
import { CreateBookingModal } from "@/components/dashboard/bookings/CreateBookingModal";
import { RescheduleModal } from "@/components/dashboard/bookings/RescheduleModal";
import { SchedulePage } from "@/components/dashboard/schedule/SchedulePage";
import { TeamPage } from "@/components/dashboard/team/TeamPage";
import { CalendarControls, type CalendarViewType } from "./CalendarControls";
import { CalendarMatrixView } from "./CalendarMatrixView";
import { useBookings } from "@/hooks/useBookings";
import { useStaff } from "@/hooks/useStaff";
import type { BookingDto } from "@/lib/api/bookings";

type MainSectionTab = "bookings" | "schedule" | "team";

export function CalendarPage() {
  const t = useTranslations("dashboard");
  const [sectionTab, setSectionTab] = useState<MainSectionTab>("bookings");
  const [viewType, setViewType] = useState<CalendarViewType>("matrix");
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
          sectionTab === "bookings" && (
            <CalendarControls
              selectedDate={selectedDate}
              viewType={viewType}
              onDateChange={setSelectedDate}
              onViewChange={setViewType}
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )
        }
        tabs={[
          {
            id: "bookings",
            label: t("calendar.tab_bookings"),
            icon: CalendarCheck,
            active: sectionTab === "bookings",
            onClick: () => setSectionTab("bookings"),
          },
          {
            id: "schedule",
            label: t("calendar.tab_schedule"),
            icon: Clock,
            active: sectionTab === "schedule",
            onClick: () => setSectionTab("schedule"),
          },
          {
            id: "team",
            label: t("calendar.tab_team"),
            icon: UserCheck,
            count: staff.length,
            active: sectionTab === "team",
            onClick: () => setSectionTab("team"),
          },
        ]}
      />

      {/* Tab 1: Bookings Calendar & Matrix */}
      {sectionTab === "bookings" && (
        <div className="space-y-4">
          <StaffSelector
            staffList={staff}
            selectedStaffId={selectedStaffId}
            onSelect={setSelectedStaffId}
          />

          {viewType === "matrix" ? (
            <CalendarMatrixView
              activeStaff={activeStaff}
              bookings={bookings}
              onSelectBooking={setSelectedBookingId}
            />
          ) : viewType === "month" ? (
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

      {/* Tab 2: Clinic Operating Hours & Schedule */}
      {sectionTab === "schedule" && <SchedulePage />}

      {/* Tab 3: Team Roster & Shifts */}
      {sectionTab === "team" && <TeamPage />}
    </div>
  );
}
