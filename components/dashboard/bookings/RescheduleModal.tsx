"use client";

import React, { useState } from "react";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAvailableSlots } from "@/hooks/useSlots";
import type { BookingDto } from "@/lib/api/bookings";

interface RescheduleModalProps {
  booking: BookingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (bookingId: string, startTime: string, durationMinutes: number) => Promise<unknown>;
}

export function RescheduleModal({
  booking,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleModalProps) {
  const t = useTranslations("dashboard");

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = booking?.durationMinutes || 60;

  const { slots, isBusinessOpen, totalAvailableSlots, isLoading } = useAvailableSlots({
    staffId: booking?.staffId || undefined,
    date,
    durationMinutes: duration,
  });

  if (!isOpen || !booking) return null;

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      const startTime = localDate.toISOString();

      await onReschedule(booking.id, startTime, duration);
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={t("bookings.reschedule_btn")}
      description={t("bookings.reschedule_desc", { name: booking.clientName })}
    >
      <div className="space-y-4">
        {/* Date input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("bookings.new_date_label")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot("");
            }}
            className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
          />
        </div>

        {/* Business Closed Banner */}
        {!isBusinessOpen && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t("bookings.clinic_closed_short")}</span>
          </div>
        )}

        {/* Slot Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{t("bookings.slot_select_title")}</span>
            {isLoading ? (
              <span className="text-[11px] text-primary animate-pulse">
                {t("bookings.slots_loading")}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono font-normal">
                {totalAvailableSlots} {t("bookings.slots_count_suffix")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
            {slots.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-6 text-xs text-muted-foreground">
                {t("bookings.no_slots_available")}
              </div>
            )}

            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.startTime;
              const isAvailable = slot.available;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedSlot(slot.startTime)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : isAvailable
                      ? "bg-card border-border/60 text-foreground hover:border-primary/50 cursor-pointer"
                      : "bg-muted/30 border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                  }`}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t("bookings.cancel_btn")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleReschedule}
            disabled={!selectedSlot || isSubmitting}
            loading={isSubmitting}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {t("bookings.reschedule_action_btn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
