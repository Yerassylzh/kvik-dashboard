"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { FollowUpLogStatus } from "@/lib/api/followUps";

interface FollowUpLogStatusBadgeProps {
  status: FollowUpLogStatus;
  className?: string;
}

export function FollowUpLogStatusBadge({
  status,
  className,
}: FollowUpLogStatusBadgeProps) {
  const t = useTranslations("dashboard");

  switch (status) {
    case "PENDING":
      return (
        <Badge variant="default" className={className}>
          {t("automations.status_pending")}
        </Badge>
      );
    case "SENT":
      return (
        <Badge variant="info" className={className}>
          {t("automations.status_sent")}
        </Badge>
      );
    case "REPLIED":
      return (
        <Badge variant="success" className={className}>
          {t("automations.status_replied")}
        </Badge>
      );
    case "SKIPPED":
      return (
        <Badge variant="warning" className={className}>
          {t("automations.status_skipped")}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive" className={className}>
          {t("automations.status_cancelled")}
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className={className}>
          {status}
        </Badge>
      );
  }
}
