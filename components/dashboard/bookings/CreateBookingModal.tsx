"use client";

import React, { useState } from "react";
import { Clock, User, Calendar, Plus } from "lucide-react";
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

  const [staffId, setStaffId] = useState<string>(staffList[0]?.id || "");
  const [date, setDate] = useState<string>(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+7");
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { slots, isLoading: isSlotsLoading } = useAvailableSlots({
    staffId: staffId || undefined,
    date,
    durationMinutes,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const startTime = `${date}T${selectedSlot}:00Z`;
      await onCreate({
        staffId: staffId || undefined,
        serviceName: serviceName || "Услуга",
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
      title="Новая запись"
      description="Создание записи клиента с проверкой доступных слотов"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Staff & Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Специалист</label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSelectedSlot("");
              }}
              className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Любой специалист</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.role ? `(${st.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Дата</label>
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
        </div>

        {/* Dynamic Slot Engine */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("bookings.slot_select_title")}</span>
            {isSlotsLoading && <span className="text-[11px] text-primary animate-pulse">Загрузка слотов...</span>}
          </label>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
            {slots.length === 0 && !isSlotsLoading && (
              <div className="col-span-full text-center py-4 text-xs text-muted-foreground">
                Нет доступных слотов на эту дату
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
                      ? "bg-card border-border/60 text-foreground hover:border-primary/50"
                      : "bg-muted/30 border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                  }`}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
        </div>

        {/* Client Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t("bookings.client_name")} *</label>
            <Input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Айгерим Бекова"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t("bookings.client_phone")} *</label>
            <Input
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+7 701 123 4567"
            />
          </div>
        </div>

        {/* Service & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t("bookings.service")}</label>
            <Input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Стрижка, Маникюр..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t("bookings.price")}</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!clientName.trim() || !clientPhone.trim() || !selectedSlot || isSubmitting}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Создать запись</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
