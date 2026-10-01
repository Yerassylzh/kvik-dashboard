"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAvailableSlots } from "@/hooks/useSlots";
import type { StaffDto } from "@/lib/api/staff";
import type { CreateBookingPayload } from "@/lib/api/bookings";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffDto[];
  onCreate: (payload: CreateBookingPayload) => Promise<unknown>;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  staffList,
  onCreate,
}: CreateBookingModalProps) {
  const t = useTranslations("dashboard");

  const todayStr = new Date().toISOString().split("T")[0];

  const [staffId, setStaffId] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [durationMinutes] = useState<number>(60);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+7");
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { slots, isBusinessOpen, totalAvailableSlots, isLoading: isSlotsLoading } = useAvailableSlots({
    staffId: staffId || undefined,
    date,
    durationMinutes,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      // Build ISO datetime in local time
      const [year, month, day] = date.split("-").map(Number);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      const startTime = localDate.toISOString();

      // Resolve final staff ID: user selected or auto-assigned from slot specialist
      const finalStaffId = staffId || assignedStaffId || undefined;

      await onCreate({
        staffId: finalStaffId,
        serviceName: serviceName || t("bookings.default_service"),
        price: price ? Number(price) : undefined,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        startTime,
        durationMinutes,
        notes: notes.trim() || undefined,
      });
      onClose();
      // Reset form
      setClientName("");
      setServiceName("");
      setPrice("");
      setNotes("");
      setSelectedSlot("");
      setAssignedStaffId("");
    } catch {
      // Error handled by parent / interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={t("bookings.new_booking_modal_title")}
      description={t("bookings.new_booking_modal_desc")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Staff & Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.specialist_label")}
            </label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSelectedSlot("");
                setAssignedStaffId("");
              }}
              className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">{t("bookings.any_specialist")}</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.role ? `(${st.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.date_label")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot("");
                setAssignedStaffId("");
              }}
              className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Business Closed Banner */}
        {!isBusinessOpen && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t("bookings.clinic_closed_alert")}</span>
          </div>
        )}

        {/* Dynamic Slot Engine */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{t("bookings.slot_select_title")}</span>
            {isSlotsLoading ? (
              <span className="text-[11px] text-primary animate-pulse">
                {t("bookings.slots_loading")}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono font-normal">
                {totalAvailableSlots} {t("bookings.slots_count_suffix")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
            {slots.length === 0 && !isSlotsLoading && (
              <div className="col-span-full text-center py-4 text-xs text-muted-foreground">
                {t("bookings.no_slots_available")}
              </div>
            )}

            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.startTime;
              const isAvailable = slot.available;
              const staffNames = slot.staff?.map((s) => s.name).join(", ");

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!isAvailable}
                  title={staffNames ? `${t("bookings.specialist_label")}: ${staffNames}` : undefined}
                  onClick={() => {
                    setSelectedSlot(slot.startTime);
                    if (!staffId && slot.staff && slot.staff.length > 0) {
                      setAssignedStaffId(slot.staff[0].id);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : isAvailable
                      ? "bg-card border-border/60 text-foreground hover:border-primary/50"
                      : "bg-muted/30 border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                  }`}
                >
                  <span>{slot.startTime}</span>
                  {!staffId && slot.staff && slot.staff.length > 0 && isAvailable && (
                    <span className="text-[9px] font-sans opacity-80 truncate max-w-full font-normal">
                      {slot.staff.length > 1 ? `${slot.staff.length}` : slot.staff[0].name.split(" ")[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Client Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.client_name_label")}
            </label>
            <Input
              type="text"
              required
              placeholder="Анна Смирнова"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.client_phone_label")}
            </label>
            <Input
              type="tel"
              required
              placeholder="+7 (777) 123-45-67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.service_label")}
            </label>
            <Input
              type="text"
              placeholder={t("bookings.service_placeholder")}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("bookings.price_label")}
            </label>
            <Input
              type="number"
              placeholder="15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("bookings.notes_label")}
          </label>
          <Input
            type="text"
            placeholder={t("bookings.notes_placeholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t("bookings.cancel_btn")}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!clientName.trim() || !clientPhone.trim() || !selectedSlot || isSubmitting}
            loading={isSubmitting}
          >
            {t("bookings.create_booking_btn")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
