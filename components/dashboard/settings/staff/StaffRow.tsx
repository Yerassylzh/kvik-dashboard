"use client";

import React, { useState } from "react";
import {
  Calendar,
  MoreVertical,
  Mail,
  X,
  Pencil,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);

  const canInvite =
    Boolean(member.email) &&
    (member.inviteStatus === "NONE" || member.inviteStatus === "REVOKED");
  const canResend = member.inviteStatus === "PENDING";
  const canRevoke = member.inviteStatus === "PENDING";

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl bg-card border transition-all ${
        isScheduling
          ? "border-primary shadow-xs"
          : "border-border/60 hover:border-border"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <EntityAvatar name={member.name} size="md" />

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-foreground truncate">{member.name}</h4>
            <SystemRoleBadge role={member.systemRole} />
            <InviteStatusBadge status={member.inviteStatus} />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            {member.role && <span>{member.role}</span>}
            {member.phone && (
              <>
                <span>·</span>
                <span className="font-mono">{member.phone}</span>
              </>
            )}
            {member.email && (
              <>
                <span>·</span>
                <span>{member.email}</span>
              </>
            )}
            {member.specializations && member.specializations.length > 0 && (
              <>
                <span>·</span>
                <span className="text-primary/80">
                  {member.specializations.slice(0, 2).join(", ")}
                  {member.specializations.length > 2 &&
                    ` +${member.specializations.length - 2}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSchedule}
          leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}
          className="text-xs h-8 border-border/60"
        >
          <span className="hidden sm:inline">{t("staff.schedule_btn")}</span>
        </Button>

        {/* Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-9 z-30 bg-card border border-border/80 rounded-xl shadow-lg min-w-48 py-1.5 text-xs">
                <button
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
                  onClick={() => {
                    onEdit();
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("staff.action_edit")}
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
                  onClick={() => {
                    onSchedule();
                    setOpen(false);
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("staff.action_schedule")}
                </button>

                {(canInvite || canResend) && (
                  <div className="border-t border-border/40 mt-1 pt-1">
                    <button
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
                      onClick={() => {
                        onInvite();
                        setOpen(false);
                      }}
                    >
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {canResend ? t("staff.action_resend") : t("staff.action_invite")}
                    </button>
                  </div>
                )}

                {canRevoke && (
                  <button
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-destructive/10 text-destructive text-left transition-colors"
                    onClick={() => {
                      onRevoke();
                      setOpen(false);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    {t("staff.action_revoke")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
