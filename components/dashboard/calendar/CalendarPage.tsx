"use client";

import React, { useState } from "react";
import {
  Plus,
  LayoutGrid,
  CalendarDays,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  CalendarCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffSelector } from "@/components/dashboard/bookings/StaffSelector";
import { BookingCalendar } from "@/components/dashboard/bookings/BookingCalendar";
import { BookingList } from "@/components/dashboard/bookings/BookingList";
import { BookingDetail } from "@/components/dashboard/bookings/BookingDetail";
import { CreateBookingModal } from "@/components/dashboard/bookings/CreateBookingModal";
import { RescheduleModal } from "@/components/dashboard/bookings/RescheduleModal";
import { SchedulePage } from "@/components/dashboard/schedule/SchedulePage";
import { TeamPage } from "@/components/dashboard/team/TeamPage";
import { useBookings } from "@/hooks/useBookings";
import { useStaff } from "@/hooks/useStaff";
import type { BookingDto } from "@/lib/api/bookings";
import { format, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import clsx from "clsx";

type MainSectionTab = "bookings" | "schedule" | "team";
type ViewType = "matrix" | "month" | "list";

export function CalendarPage() {
  const t = useTranslations("dashboard");
  const [sectionTab, setSectionTab] = useState<MainSectionTab>("bookings");
  const [viewType, setViewType] = useState<ViewType>("matrix");
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
        badge={
          <Badge variant="primary">
            {bookings.length}
          </Badge>
        }
        actions={
          sectionTab === "bookings" && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date navigation */}
              <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => subDays(prev, 1))}
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
                  onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/70">
                <button
                  type="button"
                  onClick={() => setViewType("matrix")}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                    viewType === "matrix"
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("calendar.view_matrix")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewType("month")}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                    viewType === "month"
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("calendar.view_month")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewType("list")}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                    viewType === "list"
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("calendar.view_list")}</span>
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {t("calendar.new_booking")}
              </Button>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {activeStaff.length === 0 ? (
                <div className="col-span-full p-8 text-center border border-dashed border-border/80 rounded-xl bg-card">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("calendar.empty_slots")}
                  </p>
                </div>
              ) : (
                activeStaff.map((member) => {
                  const staffBookings = bookings.filter((b) => b.staffId === member.id);
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                            {member.name?.[0]?.toUpperCase() || "M"}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-tight">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {member.role || "Специалист"}
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
                              onClick={() => setSelectedBookingId(b.id)}
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
                })
              )}
            </div>
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
