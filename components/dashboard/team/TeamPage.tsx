"use client";

import React, { useState } from "react";
import { Plus, CalendarOff, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { StaffList } from "@/components/dashboard/settings/staff/StaffList";
import { StaffInviteModal } from "@/components/dashboard/settings/staff/StaffInviteModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStaff } from "@/hooks/useStaff";

export function TeamPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<"roster" | "vacations">("roster");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { staff, createStaff } = useStaff();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("team.title")}
        description={t("team.desc")}
        badge={
          <Badge variant="primary">
            {staff.length} {t("team.tab_roster")}
          </Badge>
        }
        actions={
          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs rounded-xl"
          >
            {t("team.add_specialist")}
          </Button>
        }
        tabs={[
          {
            id: "roster",
            label: t("team.tab_roster"),
            icon: Users,
            count: staff.length,
            active: activeTab === "roster",
            onClick: () => setActiveTab("roster"),
          },
          {
            id: "vacations",
            label: t("team.tab_vacations"),
            icon: CalendarOff,
            active: activeTab === "vacations",
            onClick: () => setActiveTab("vacations"),
          },
        ]}
      />

      {activeTab === "roster" ? (
        <StaffList />
      ) : (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-card/40 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {t("team.vacations_placeholder_title")}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t("team.vacations_placeholder_desc")}
          </p>
        </div>
      )}

      {/* Invite Specialist Modal */}
      <StaffInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={createStaff}
      />
    </div>
  );
}
