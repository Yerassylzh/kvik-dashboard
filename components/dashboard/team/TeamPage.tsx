"use client";

import React, { useState } from "react";
import { Plus, CalendarOff, Users, CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { StaffList } from "@/components/dashboard/settings/staff/StaffList";
import { StaffInviteModal } from "@/components/dashboard/settings/staff/StaffInviteModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

      {activeTab === "roster" && <StaffList />}

      {activeTab === "shifts" && (
        <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 space-y-2">
          <CalendarCheck className="w-8 h-8 text-primary mx-auto opacity-80 mb-2" />
          <p className="text-sm font-semibold text-foreground">
            {t("team.shifts_placeholder_title")}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t("team.shifts_placeholder_desc")}
          </p>
        </div>
      )}

      {activeTab === "vacations" && (
        <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 space-y-2">
          <CalendarOff className="w-8 h-8 text-muted-foreground mx-auto opacity-80 mb-2" />
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
