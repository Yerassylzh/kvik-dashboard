"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { InviteStatus } from "@/lib/api/staff";

export function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const t = useTranslations("dashboard");
  const cfg: Record<InviteStatus, { label: string; classes: string }> = {
    ACCEPTED: {
      label: t("staff.invite_status_accepted"),
      classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    PENDING: {
      label: t("staff.invite_status_pending"),
      classes: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    NONE: {
      label: t("staff.invite_status_none"),
      classes: "bg-muted/60 text-muted-foreground border-border/60",
    },
    REVOKED: {
      label: t("staff.invite_status_revoked"),
      classes: "bg-muted/60 text-muted-foreground border-border/60",
    },
  };

  const { label, classes } = cfg[status] || cfg.NONE;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}

export function SystemRoleBadge({ role }: { role: string }) {
  const t = useTranslations("dashboard");
  if (role === "OWNER") {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
        {t("staff.role_owner")}
      </span>
    );
  }
  if (role === "ADMIN_MANAGER") {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
        {t("staff.role_admin_manager")}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 border border-violet-500/20">
      {t("staff.role_specialist")}
    </span>
  );
}
