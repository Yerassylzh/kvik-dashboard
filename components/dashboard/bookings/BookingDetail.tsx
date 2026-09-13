"use client";

import React from "react";
import { Clock, User, Phone, Calendar, CheckCircle2, XCircle, RefreshCw, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { useBookingDetail } from "@/hooks/useBookings";
import type { BookingDto, BookingStatus } from "@/lib/api/bookings";

interface BookingDetailProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onOpenReschedule: (booking: BookingDto) => void;
}

export function BookingDetail({
  bookingId,
  isOpen,
  onClose,
  onStatusChange,
  onOpenReschedule,
}: BookingDetailProps) {
  const t = useTranslations("dashboard");
  const { booking } = useBookingDetail(bookingId);

  if (!isOpen || !booking) return null;

  const startTime = new Date(booking.startTime).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(booking.endTime).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = new Date(booking.startTime).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title="Детали записи"
      description={`Запись #${booking.id.slice(0, 8)}`}
    >
      <div className="space-y-5">
        {/* Client Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <EntityAvatar name={booking.clientName} size="md" />
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate">{booking.clientName}</h4>
              <p className="text-xs text-muted-foreground font-mono">{booking.clientPhone}</p>
            </div>
          </div>
          <StatusBadge type="booking" status={booking.status} />
        </div>

        {/* Service & Time Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground">Услуга</span>
            <div className="font-semibold text-xs text-foreground truncate">
              {booking.serviceName || "Услуга"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground">Стоимость</span>
            <div className="font-mono font-bold text-xs text-foreground">
              {booking.price ? `${Number(booking.price).toLocaleString("ru-RU")} ${t("common.currency")}` : "—"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground">Дата</span>
            <div className="font-medium text-xs text-foreground">{dateStr}</div>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground">Время</span>
            <div className="font-semibold text-xs text-primary font-mono">
              {startTime} – {endTime} ({booking.durationMinutes} мин)
            </div>
          </div>
        </div>

        {/* Staff Specialist */}
        {booking.staffName && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="text-xs">
              <span className="text-muted-foreground">Специалист: </span>
              <span className="font-semibold text-foreground">{booking.staffName}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="p-3 rounded-xl bg-card border border-border/50 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block mb-1">Примечание:</span>
            {booking.notes}
          </div>
        )}

        {/* Status Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {booking.status === "PENDING" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStatusChange(booking.id, "CONFIRMED")}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {t("bookings.confirm_btn")}
            </Button>
          )}

          {booking.status === "CONFIRMED" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStatusChange(booking.id, "COMPLETED")}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="text-xs bg-emerald-600 hover:bg-emerald-500"
            >
              {t("bookings.complete_btn")}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onOpenReschedule(booking);
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-primary" />}
            className="text-xs border-border/60"
          >
            {t("bookings.reschedule_btn")}
          </Button>

          {booking.status !== "CANCELLED" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {t("bookings.cancel_btn")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
