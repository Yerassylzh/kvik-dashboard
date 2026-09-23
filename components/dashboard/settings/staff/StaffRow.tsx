"use client";

import React from "react";
import {
  Calendar,
  MoreVertical,
  Mail,
  X,
  Pencil,
  Clock,
  Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { InviteStatusBadge, SystemRoleBadge } from "./StaffBadges";
import type { StaffDto } from "@/lib/api/staff";

interface StaffRowProps {
  member: StaffDto;
  isScheduling: boolean;
  onEdit: () => void;
  onSchedule: () => void;
  onInvite: () => void;
  onRevoke: () => void;
}

export function StaffRow({
  member,
  isScheduling,
  onEdit,
  onSchedule,
  onInvite,
  onRevoke,
}: StaffRowProps) {
  const t = useTranslations("dashboard");

  const canInvite =
    Boolean(member.email) &&
    (member.inviteStatus === "NONE" || member.inviteStatus === "REVOKED");
  const canResend = member.inviteStatus === "PENDING";
  const canRevoke = member.inviteStatus === "PENDING";

  return (
    <div
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-card border transition-all gap-4 shadow-2xs hover:shadow-xs ${
        isScheduling
          ? "border-primary ring-2 ring-primary/20 shadow-xs"
          : "border-border/80 hover:border-border"
      }`}
    >
      {/* Left: Avatar + Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <EntityAvatar
          name={member.name}
          src={member.avatarUrl ?? undefined}
          size="md"
        />

        <div className="min-w-0 space-y-1">
          {/* Row 1: Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground tracking-tight truncate">
              {member.name}
            </h4>
            <SystemRoleBadge role={member.systemRole} />
            <InviteStatusBadge status={member.inviteStatus} />
            {!member.isActive && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                Неактивен
              </span>
            )}
          </div>

          {/* Row 2: Metadata (Role, Phone, Email, Specializations) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {member.role && (
              <span className="font-medium text-foreground/80">{member.role}</span>
            )}
            {member.phone && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums">
                  <Phone className="w-3 h-3 text-muted-foreground/70" />
                  {member.phone}
                </span>
              </>
            )}
            {member.email && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] truncate max-w-[200px]">
                  <Mail className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </span>
              </>
            )}
            {member.specializations && member.specializations.length > 0 && (
              <>
                <span className="text-border">·</span>
                <span className="text-primary/90 font-medium text-[11px]">
                  {member.specializations.slice(0, 3).join(", ")}
                  {member.specializations.length > 3 &&
                    ` +${member.specializations.length - 3}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSchedule}
          leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}
          className="h-8 px-2.5 sm:px-3 text-xs border-border/80 font-medium"
        >
          <span className="hidden sm:inline">{t("staff.schedule_btn")}</span>
        </Button>

        {/* Portaled 3-Dots Dropdown Menu */}
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              title={t("common.actions")}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              <span>{t("staff.action_edit")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={onSchedule}>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              <span>{t("staff.action_schedule")}</span>
            </DropdownMenuItem>

            {(canInvite || canResend) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onInvite}>
                  <Mail className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                  <span>
                    {canResend
                      ? t("staff.action_resend")
                      : t("staff.action_invite")}
                  </span>
                </DropdownMenuItem>
              </>
            )}

            {canRevoke && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>{t("staff.action_revoke")}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>
    </div>
  );
}
