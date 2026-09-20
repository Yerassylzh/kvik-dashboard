'use client';

import React, { useState } from 'react';
import { Check, Save, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionCard } from '@/components/dashboard/shared/SectionCard';
import { Button } from '@/components/ui/button';
import type { RoundRobinStrategy, UpdateRoundRobinSettingsPayload } from '@/lib/api/round-robin';

interface RoundRobinGlobalCardProps {
  enabled: boolean;
  strategy: RoundRobinStrategy;
  matchSpecialization: boolean;
  considerWeeklyLoad: boolean;
  onSave: (payload: UpdateRoundRobinSettingsPayload) => Promise<void>;
}

const STRATEGIES: {
  value: RoundRobinStrategy;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: 'LEAST_LOADED',
    labelKey: 'settings.rr_strategy_least_loaded',
    descKey: 'settings.rr_strategy_least_loaded_desc',
  },
  {
    value: 'CIRCULAR',
    labelKey: 'settings.rr_strategy_circular',
    descKey: 'settings.rr_strategy_circular_desc',
  },
  {
    value: 'WEIGHTED',
    labelKey: 'settings.rr_strategy_weighted',
    descKey: 'settings.rr_strategy_weighted_desc',
  },
];

export function RoundRobinGlobalCard({
  enabled,
  strategy,
  matchSpecialization,
  considerWeeklyLoad,
  onSave,
}: RoundRobinGlobalCardProps) {
  const t = useTranslations('dashboard');

  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localStrategy, setLocalStrategy] = useState<RoundRobinStrategy>(strategy);
  const [localMatchSpec, setLocalMatchSpec] = useState(matchSpecialization);
  const [localWeeklyLoad, setLocalWeeklyLoad] = useState(considerWeeklyLoad);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    localEnabled !== enabled ||
    localStrategy !== strategy ||
    localMatchSpec !== matchSpecialization ||
    localWeeklyLoad !== considerWeeklyLoad;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        roundRobinEnabled: localEnabled,
        strategy: localStrategy,
        matchSpecialization: localMatchSpec,
        considerWeeklyLoad: localWeeklyLoad,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setError(t('settings.rr_save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard
      title={t('settings.rr_global_card_title')}
      description={t('settings.rr_global_card_desc')}
    >
      <div className="space-y-5 pt-2">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/60">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {t('settings.rr_enabled_label')}
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              {t('settings.rr_enabled_desc')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={localEnabled}
            onClick={() => setLocalEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              localEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                localEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Strategy picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            {t('settings.rr_strategy_label')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setLocalStrategy(s.value)}
                disabled={!localEnabled}
                className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  localStrategy === s.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/60 bg-card hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  {localStrategy === s.value && (
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      localStrategy === s.value
                        ? 'text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {t(s.labelKey as any)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {t(s.descKey as any)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Boolean toggles */}
        <div className="space-y-3">
          <ToggleRow
            label={t('settings.rr_match_spec_label')}
            desc={t('settings.rr_match_spec_desc')}
            checked={localMatchSpec}
            disabled={!localEnabled}
            onChange={setLocalMatchSpec}
            id="rr-match-spec"
          />
          <ToggleRow
            label={t('settings.rr_weekly_load_label')}
            desc={t('settings.rr_weekly_load_desc')}
            checked={localWeeklyLoad}
            disabled={!localEnabled}
            onChange={setLocalWeeklyLoad}
            id="rr-weekly-load"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium">⚠️ {error}</p>
        )}

        {/* Save bar */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {t('settings.rr_saved_success')}
            </span>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            loading={isSaving}
            disabled={!isDirty}
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t('settings.rr_save_btn')}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
  id,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card transition-opacity ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <div className="space-y-0.5 pr-4">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
