'use client';

import React, { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionCard } from '@/components/dashboard/shared/SectionCard';
import { EntityAvatar } from '@/components/dashboard/shared/EntityAvatar';
import type { RoundRobinStaffEntry, RoundRobinStrategy } from '@/lib/api/round-robin';
import type { UpdateStaffRoundRobinPayload } from '@/lib/api/staff';

interface RoundRobinStaffListProps {
  staff: RoundRobinStaffEntry[];
  strategy: RoundRobinStrategy;
  globalEnabled: boolean;
  onUpdateStaff: (staffId: string, payload: UpdateStaffRoundRobinPayload) => Promise<void>;
}

function formatLastAssigned(iso: string | null, neverLabel: string): string {
  if (!iso) return neverLabel;
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return '< 1 ч назад';
  if (diffH < 24) return `${diffH} ч назад`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} дн назад`;
}

export function RoundRobinStaffList({
  staff,
  strategy,
  globalEnabled,
  onUpdateStaff,
}: RoundRobinStaffListProps) {
  const t = useTranslations('dashboard');
  const isWeighted = strategy === 'WEIGHTED';
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggle = async (entry: RoundRobinStaffEntry) => {
    setLoadingIds((s) => new Set(s).add(entry.id));
    setErrors((e) => { const n = { ...e }; delete n[entry.id]; return n; });
    try {
      await onUpdateStaff(entry.id, {
        roundRobinEnabled: !entry.roundRobinEnabled,
      });
    } catch {
      setErrors((e) => ({ ...e, [entry.id]: t('settings.rr_staff_update_error') }));
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(entry.id); return n; });
    }
  };

  const handleWeight = async (entry: RoundRobinStaffEntry, weight: number) => {
    setLoadingIds((s) => new Set(s).add(entry.id));
    try {
      await onUpdateStaff(entry.id, { roundRobinWeight: weight });
    } catch {
      setErrors((e) => ({ ...e, [entry.id]: t('settings.rr_staff_update_error') }));
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(entry.id); return n; });
    }
  };

  return (
    <SectionCard
      title={t('settings.rr_staff_card_title')}
      description={t('settings.rr_staff_card_desc')}
    >
      {!globalEnabled ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 mt-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {t('settings.rr_disabled_notice')}
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-2">
          {staff.map((entry) => {
            const isLoading = loadingIds.has(entry.id);
            const errorMsg = errors[entry.id];
            const neverLabel = t('settings.rr_staff_never_assigned');

            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border bg-card transition-all ${
                  entry.roundRobinEnabled
                    ? 'border-border/60'
                    : 'border-border/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar + name */}
                  <EntityAvatar name={entry.name} size="sm" />

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {entry.name}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Bookings today badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                          entry.activeBookingsToday > 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {t('settings.rr_staff_bookings_today', {
                          count: entry.activeBookingsToday,
                        })}
                      </span>

                      {/* Last assigned */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {entry.lastAssignedAt
                          ? t('settings.rr_staff_last_assigned', {
                              time: formatLastAssigned(entry.lastAssignedAt, neverLabel),
                            })
                          : neverLabel}
                      </span>
                    </div>
                  </div>

                  {/* Weight selector (WEIGHTED strategy only) */}
                  {isWeighted && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {t('settings.rr_staff_weight_label')}
                      </span>
                      <select
                        value={entry.roundRobinWeight ?? 1}
                        disabled={!entry.roundRobinEnabled || isLoading}
                        onChange={(e) =>
                          handleWeight(entry, Number(e.target.value))
                        }
                        className="h-7 rounded-lg border border-border/60 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {[1, 2, 3, 4, 5].map((w) => (
                          <option key={w} value={w}>
                            {w}×
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Participation toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={entry.roundRobinEnabled}
                    disabled={isLoading}
                    onClick={() => handleToggle(entry)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-wait ${
                      entry.roundRobinEnabled
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                    aria-label={t('settings.rr_staff_enabled_toggle')}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                        entry.roundRobinEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-destructive mt-2 font-medium">
                    ⚠️ {errorMsg}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
