"use client";

import React from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

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
  NEW:                 "status-new",
  QUALIFIED:           "status-qualified",
  APPOINTMENT_SET:     "status-appointment",
  DEAL_WON:            "status-won",
  DEAL_LOST:           "status-lost",
  // Booking
  PENDING:             "status-pending",
  CONFIRMED:           "status-confirmed",
  COMPLETED:           "status-completed",
  CANCELLED:           "status-cancelled",
  DECLINED:            "status-declined",
  NO_SHOW:             "status-declined",
  // Conversation
  BOT_ACTIVE:          "status-bot-active",
  MANAGER_INTERCEPTED: "status-intercepted",
  CLOSED:              "status-closed",
};

export interface StatusBadgeProps {
  status: EntityStatus;
  type?: "lead" | "booking" | "conversation" | string;
  label?: string; // Optional manual label override
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const t = useTranslations("dashboard");
  const cls = statusClassMap[status] ?? "status-closed";

  const getLocalizedLabel = (st: EntityStatus): string => {
    switch (st) {
      case "NEW":
        return t("leads.stage_new");
      case "QUALIFIED":
        return t("leads.stage_qualified");
      case "APPOINTMENT_SET":
        return t("leads.stage_appointment");
      case "DEAL_WON":
        return t("leads.stage_won");
      case "DEAL_LOST":
        return t("leads.stage_lost");
      case "PENDING":
        return t("bookings.status_pending");
      case "CONFIRMED":
        return t("bookings.status_confirmed");
      case "COMPLETED":
        return t("bookings.status_completed");
      case "CANCELLED":
        return t("bookings.status_cancelled");
      case "DECLINED":
        return t("bookings.status_declined");
      case "NO_SHOW":
        return t("leads.noshow_btn");
      case "BOT_ACTIVE":
        return t("inbox.role_bot");
      case "MANAGER_INTERCEPTED":
        return t("inbox.role_manager");
      case "CLOSED":
        return t("inbox.status_closed");
      default:
        return st;
    }
  };

  const text = label ?? getLocalizedLabel(status);

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
