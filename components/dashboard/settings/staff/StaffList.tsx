"use client";

import React, { useState } from "react";
import { Plus, User, Phone, Calendar, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { Button } from "@/components/ui/button";
import { StaffForm } from "./StaffForm";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { useStaff } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

export function StaffList() {
  const t = useTranslations("dashboard");
  const { staff, isLoading, createStaff, deactivateStaff } = useStaff(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffDto | null>(null);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Команда и специалисты"
        description="Управление сотрудниками, графиком работы и доступностью слотов для записи"
        action={
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>Добавить сотрудника</span>
          </Button>
        }
        className="max-w-3xl"
      >
        <div className="space-y-2.5 pt-2">
          {staff.length === 0 && !isLoading && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Нет добавленных сотрудников
            </div>
          )}

          {staff.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl bg-card border transition-all ${
                selectedStaff?.id === member.id
                  ? "border-primary shadow-xs"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <EntityAvatar name={member.name} size="md" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate">{member.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {member.role && <span>{member.role}</span>}
                    {member.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{member.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedStaff(selectedStaff?.id === member.id ? null : member)
                  }
                  className="text-xs gap-1.5 h-8 border-border/60"
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>График</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {selectedStaff && <AvailabilityEditor staff={selectedStaff} />}

      <StaffForm
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createStaff}
      />
    </div>
  );
}
