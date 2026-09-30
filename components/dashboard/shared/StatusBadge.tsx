"use client";

import React from "react";
import clsx from "clsx";

// ─── Lead status ─────────────────────────────────────────────────────────────
export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "APPOINTMENT_SET"
  | "DEAL_WON"
  | "DEAL_LOST";

// ─── Booking status ───────────────────────────────────────────────────────────
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"
  | "NO_SHOW";

// ─── Conversation status ──────────────────────────────────────────────────────
export type ConversationStatus =
  | "BOT_ACTIVE"
  | "MANAGER_INTERCEPTED"
  | "CLOSED";

export type EntityStatus = LeadStatus | BookingStatus | ConversationStatus;

// Maps backend enum values → CSS utility class (defined in globals.css)
const statusClassMap: Record<EntityStatus, string> = {
  // Lead
  NEW:                "status-new",
  QUALIFIED:          "status-qualified",
  APPOINTMENT_SET:    "status-appointment",
  DEAL_WON:           "status-won",
  DEAL_LOST:          "status-lost",
  // Booking
  PENDING:            "status-pending",
  CONFIRMED:          "status-confirmed",
  COMPLETED:          "status-completed",
  CANCELLED:          "status-cancelled",
  DECLINED:           "status-declined",
  NO_SHOW:            "status-declined",
  // Conversation
  BOT_ACTIVE:         "status-bot-active",
  MANAGER_INTERCEPTED:"status-intercepted",
  CLOSED:             "status-closed",
};

// Human-readable Russian labels for each status
const statusLabelMap: Record<EntityStatus, string> = {
  NEW:                 "В диалоге",
  QUALIFIED:           "Квалифицирован",
  APPOINTMENT_SET:     "Запись создана",
  DEAL_WON:            "Визит завершен",
  DEAL_LOST:           "Отказ",
  PENDING:             "Ожидает",
  CONFIRMED:           "Подтверждено",
  COMPLETED:           "Завершено",
  CANCELLED:           "Отменено",
  DECLINED:            "Отклонено",
  NO_SHOW:             "Не пришел",
  BOT_ACTIVE:          "ИИ-агент",
  MANAGER_INTERCEPTED: "Менеджер",
  CLOSED:              "Закрыт",
};

export interface StatusBadgeProps {
  status: EntityStatus;
  type?: "lead" | "booking" | "conversation" | string;
  label?: string; // Override default Russian label
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cls = statusClassMap[status] ?? "status-closed";
  const text = label ?? statusLabelMap[status] ?? status;

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-current/20",
        cls,
        className
      )}
    >
      {text}
    </span>
  );
}
