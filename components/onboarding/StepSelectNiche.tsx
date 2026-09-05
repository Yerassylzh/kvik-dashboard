"use client";

import React, { useState } from "react";
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
  icon: string;
  titleKey: string;
  descKey: string;
}> = [
  {
    id: "BEAUTY",
    icon: "💅",
    titleKey: "niche.beauty_title",
    descKey: "niche.beauty_desc",
  },
  {
    id: "CLINIC",
    icon: "🏥",
    titleKey: "niche.clinic_title",
    descKey: "niche.clinic_desc",
  },
  {
    id: "FITNESS",
    icon: "🏋️",
    titleKey: "niche.fitness_title",
    descKey: "niche.fitness_desc",
  },
  {
    id: "CONSULTING",
    icon: "💼",
    titleKey: "niche.consulting_title",
    descKey: "niche.consulting_desc",
  },
  {
    id: "OTHER_CALENDAR",
    icon: "📅",
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
    <StaggerContainer
      staggerDelay={0.06}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {NICHES.map((niche) => {
        const isSelected = selectedId === niche.id;

        return (
          <StaggerItem key={niche.id} className="h-full">
            <InteractiveCard
              selected={isSelected}
              disabled={loading}
              onClick={() => handlePick(niche.id)}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/60 hover:bg-muted/40 text-left group flex flex-col justify-between min-h-[14rem] h-full shadow-sm"
            >
              <div>
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-accent-brand flex items-center justify-center text-2xl mb-3.5 group-hover:scale-105 transition-transform duration-200">
                  {niche.icon}
                </div>
                <h3 className="font-bold text-foreground text-base group-hover:text-accent-brand transition-colors">
                  {t(niche.titleKey as any)}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t(niche.descKey as any)}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-accent-brand group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  {t("niche.btn_select")}
                </span>
                {isSelected && (
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
            </InteractiveCard>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
