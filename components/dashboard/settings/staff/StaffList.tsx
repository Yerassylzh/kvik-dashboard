"use client";

import React, { useState, useMemo } from "react";
import { User, Search, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StaffEditModal } from "./StaffEditModal";
import { AvailabilityModal } from "./AvailabilityModal";
import { StaffRow } from "./StaffRow";
import { useStaff } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

interface StaffListProps {
  onOpenInvite?: () => void;
}

export function StaffList({ onOpenInvite }: StaffListProps) {
  const t = useTranslations("dashboard");
  const {
    staff,
    isLoading,
    updateStaff,
    deactivateStaff,
    inviteStaff,
    revokeInvite,
  } = useStaff();

  const [search, setSearch] = useState("");
  const [editingStaff, setEditingStaff] = useState<StaffDto | null>(null);
  const [schedulingStaff, setSchedulingStaff] = useState<StaffDto | null>(null);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((m) => {
      const matchName = m.name?.toLowerCase().includes(q);
      const matchRole = m.role?.toLowerCase().includes(q);
      const matchPhone = m.phone?.includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchSpecs = m.specializations?.some((s) =>
        s.toLowerCase().includes(q)
      );
      return matchName || matchRole || matchPhone || matchEmail || matchSpecs;
    });
  }, [staff, search]);

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
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      {staff.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("staff.search_placeholder")}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-medium tabular-nums hidden sm:block">
            {t("team.tab_roster")}:{" "}
            <span className="font-semibold text-foreground">
              {filteredStaff.length}
            </span>{" "}
            / {staff.length}
          </div>
        </div>
      )}

      {/* Staff Roster List */}
      <div className="space-y-2.5">
        {isLoading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-card border border-border/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state when no specialists exist yet */}
        {!isLoading && staff.length === 0 && (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border/80 bg-card/60 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-semibold text-sm text-foreground">
                {t("staff.empty_title")}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("staff.empty_desc")}
              </p>
            </div>
            {onOpenInvite && (
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={onOpenInvite}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="text-xs font-medium"
                >
                  {t("team.add_specialist")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty state when search returns zero matches */}
        {!isLoading && staff.length > 0 && filteredStaff.length === 0 && (
          <div className="text-center py-12 px-4 rounded-xl border border-border/60 bg-card space-y-2">
            <Search className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-xs text-foreground">
              {t("staff.no_search_results")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("staff.no_search_results_desc")}
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="text-xs h-8"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Specialist Cards */}
        {filteredStaff.map((member) => (
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

      {/* Modals */}
      <AvailabilityModal
        staff={schedulingStaff}
        isOpen={Boolean(schedulingStaff)}
        onClose={() => setSchedulingStaff(null)}
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
