"use client";

import React, { useState } from "react";
import { Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { StaffInviteModal } from "./StaffInviteModal";
import { StaffEditModal } from "./StaffEditModal";
import { AvailabilityModal } from "./AvailabilityModal";
import { StaffRow } from "./StaffRow";
import { useStaff } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

export function StaffList() {
  const t = useTranslations("dashboard");
  const { staff, isLoading, createStaff, updateStaff, deactivateStaff, inviteStaff, revokeInvite } =
    useStaff(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffDto | null>(null);
  const [schedulingStaff, setSchedulingStaff] = useState<StaffDto | null>(null);

  const handleInvite = async (member: StaffDto) => {
    try {
      await inviteStaff(member.id);
    } catch {
      // Handled globally
    }
  };

  const handleRevoke = async (member: StaffDto) => {
    try {
      await revokeInvite(member.id);
    } catch {
      // Handled globally
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("staff.title")}
        description={t("staff.description")}
        action={
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            {t("staff.add_btn")}
          </Button>
        }
        className="max-w-4xl"
      >
        <div className="space-y-2.5 pt-2">
          {isLoading && (
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && staff.length === 0 && (
            <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
              <User className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="font-medium">{t("staff.empty_title")}</p>
              <p>{t("staff.empty_desc")}</p>
            </div>
          )}

          {staff.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              isScheduling={schedulingStaff?.id === member.id}
              onEdit={() => setEditingStaff(member)}
              onSchedule={() => setSchedulingStaff(member)}
              onInvite={() => handleInvite(member)}
              onRevoke={() => handleRevoke(member)}
            />
          ))}
        </div>
      </SectionCard>

      <AvailabilityModal
        staff={schedulingStaff}
        isOpen={Boolean(schedulingStaff)}
        onClose={() => setSchedulingStaff(null)}
      />

      <StaffInviteModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createStaff}
      />

      <StaffEditModal
        staff={editingStaff}
        isOpen={Boolean(editingStaff)}
        onClose={() => setEditingStaff(null)}
        onSubmit={updateStaff}
        onDeactivate={deactivateStaff}
      />
    </div>
  );
}
