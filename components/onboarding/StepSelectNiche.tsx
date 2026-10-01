"use client";

import React, { useState } from "react";
import { Sparkles, Stethoscope, Dumbbell, Briefcase, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { NicheProfile } from "@/types/niche";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion/StaggerContainer";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";

interface StepSelectNicheProps {
  onSelect: (niche: NicheProfile) => void;
  loading: boolean;
}

const NICHES: Array<{
  id: NicheProfile;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
}> = [
  {
    id: "BEAUTY",
    icon: Sparkles,
    titleKey: "niche.beauty_title",
    descKey: "niche.beauty_desc",
  },
  {
    id: "CLINIC",
    icon: Stethoscope,
    titleKey: "niche.clinic_title",
    descKey: "niche.clinic_desc",
  },
  {
    id: "FITNESS",
    icon: Dumbbell,
    titleKey: "niche.fitness_title",
    descKey: "niche.fitness_desc",
  },
  {
    id: "CONSULTING",
    icon: Briefcase,
    titleKey: "niche.consulting_title",
    descKey: "niche.consulting_desc",
  },
  {
    id: "OTHER_CALENDAR",
    icon: Calendar,
    titleKey: "niche.other_calendar_title",
    descKey: "niche.other_calendar_desc",
  },
];

export function StepSelectNiche({ onSelect, loading }: StepSelectNicheProps) {
  const t = useTranslations("onboarding");
  const [selectedId, setSelectedId] = useState<NicheProfile | null>(null);

  const handlePick = (niche: NicheProfile) => {
    setSelectedId(niche);
    onSelect(niche);
  };

  return (
    <div className="w-full">
      <StaggerContainer
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        staggerDelay={0.06}
      >
        {NICHES.map((niche) => {
          const isSelected = selectedId === niche.id;
          const isProcessing = loading && isSelected;
          const Icon = niche.icon;

          return (
            <StaggerItem key={niche.id}>
              <InteractiveCard
                onClick={() => !loading && handlePick(niche.id)}
                className={`relative flex flex-col justify-between p-6 rounded-2xl border text-left transition-all h-full min-h-[140px] cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm"
                    : "border-border hover:border-primary/40 bg-card hover:bg-muted/30 shadow-2xs"
                } ${loading && !isSelected ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isProcessing && (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    {t(niche.titleKey as Parameters<typeof t>[0])}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t(niche.descKey as Parameters<typeof t>[0])}
                  </p>
                </div>
              </InteractiveCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
