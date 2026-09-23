"use client";

import React, { useState } from "react";
import { Plus, CalendarOff, Users, CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { StaffList } from "@/components/dashboard/settings/staff/StaffList";
import { StaffInviteModal } from "@/components/dashboard/settings/staff/StaffInviteModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamShiftsTab } from "@/components/dashboard/team/TeamShiftsTab";
import { TeamVacationsTab } from "@/components/dashboard/team/TeamVacationsTab";
import { useStaff } from "@/hooks/useStaff";

type TeamTab = "roster" | "shifts" | "vacations";

export function TeamPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<TeamTab>("roster");
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
            className="text-xs"
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
            id: "shifts",
            label: t("team.tab_shifts"),
            icon: CalendarCheck,
            active: activeTab === "shifts",
            onClick: () => setActiveTab("shifts"),
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

      {activeTab === "roster" && (
        <StaffList onOpenInvite={() => setIsInviteOpen(true)} />
      )}

      {activeTab === "shifts" && <TeamShiftsTab />}

      {activeTab === "vacations" && <TeamVacationsTab />}

      {/* Invite Specialist Modal */}
      <StaffInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={createStaff}
      />
    </div>
  );
}
