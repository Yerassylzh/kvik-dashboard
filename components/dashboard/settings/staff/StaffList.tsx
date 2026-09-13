'use client';

import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  MoreVertical,
  Mail,
  X,
  Pencil,
  User,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionCard } from '@/components/dashboard/shared/SectionCard';
import { EntityAvatar } from '@/components/dashboard/shared/EntityAvatar';
import { Button } from '@/components/ui/button';
import { StaffInviteModal } from './StaffInviteModal';
import { StaffEditModal } from './StaffEditModal';
import { AvailabilityModal } from './AvailabilityModal';
import { useStaff } from '@/hooks/useStaff';
import type { StaffDto } from '@/lib/api/staff';
import type { InviteStatus } from '@/lib/api/staff';

// ─── Sub-components ──────────────────────────────────────────────────────────

function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const t = useTranslations('dashboard');
  const cfg: Record<InviteStatus, { label: string; classes: string }> = {
    ACCEPTED: {
      label: t('staff.invite_status_accepted'),
      classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    PENDING: {
      label: t('staff.invite_status_pending'),
      classes: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    NONE: {
      label: t('staff.invite_status_none'),
      classes: 'bg-muted/60 text-muted-foreground border-border/60',
    },
    REVOKED: {
      label: t('staff.invite_status_revoked'),
      classes: 'bg-muted/60 text-muted-foreground border-border/60',
    },
  };

  const { label, classes } = cfg[status] || cfg.NONE;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}

function SystemRoleBadge({ role }: { role: string }) {
  const t = useTranslations('dashboard');
  if (role === 'OWNER') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
        {t('staff.role_owner')}
      </span>
    );
  }
  if (role === 'ADMIN_MANAGER') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
        {t('staff.role_admin_manager')}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 border border-violet-500/20">
      {t('staff.role_specialist')}
    </span>
  );
}

// ─── Staff Row Actions Menu ───────────────────────────────────────────────────

interface ActionsMenuProps {
  staff: StaffDto;
  onEdit: () => void;
  onSchedule: () => void;
  onInvite: () => void;
  onRevoke: () => void;
}

function ActionsMenu({ staff, onEdit, onSchedule, onInvite, onRevoke }: ActionsMenuProps) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const canInvite = Boolean(staff.email) && (staff.inviteStatus === 'NONE' || staff.inviteStatus === 'REVOKED');
  const canResend = staff.inviteStatus === 'PENDING';
  const canRevoke = staff.inviteStatus === 'PENDING';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-30 bg-card border border-border/80 rounded-xl shadow-lg min-w-48 py-1.5 text-xs">
            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
              onClick={() => { onEdit(); setOpen(false); }}
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              {t('staff.action_edit')}
            </button>
            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
              onClick={() => { onSchedule(); setOpen(false); }}
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {t('staff.action_schedule')}
            </button>

            {(canInvite || canResend) && (
              <div className="border-t border-border/40 mt-1 pt-1">
                <button
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-muted/60 text-foreground text-left transition-colors"
                  onClick={() => { onInvite(); setOpen(false); }}
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {canResend ? t('staff.action_resend') : t('staff.action_invite')}
                </button>
              </div>
            )}

            {canRevoke && (
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-destructive/10 text-destructive text-left transition-colors"
                onClick={() => { onRevoke(); setOpen(false); }}
              >
                <X className="w-3.5 h-3.5" />
                {t('staff.action_revoke')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main StaffList ───────────────────────────────────────────────────────────

export function StaffList() {
  const t = useTranslations('dashboard');
  const { staff, isLoading, createStaff, updateStaff, deactivateStaff, inviteStaff, revokeInvite } =
    useStaff(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffDto | null>(null);
  const [schedulingStaff, setSchedulingStaff] = useState<StaffDto | null>(null);

  const handleInvite = async (member: StaffDto) => {
    try {
      await inviteStaff(member.id);
    } catch {
      // Error handled by toast via axios interceptor
    }
  };

  const handleRevoke = async (member: StaffDto) => {
    try {
      await revokeInvite(member.id);
    } catch {
      // Error handled by toast via axios interceptor
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t('staff.title')}
        description={t('staff.description')}
        action={
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            {t('staff.add_btn')}
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
              <p className="font-medium">{t('staff.empty_title')}</p>
              <p>{t('staff.empty_desc')}</p>
            </div>
          )}

          {staff.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl bg-card border transition-all ${
                schedulingStaff?.id === member.id
                  ? 'border-primary shadow-xs'
                  : 'border-border/60 hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <EntityAvatar name={member.name} size="md" />

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-foreground truncate">{member.name}</h4>
                    <SystemRoleBadge role={member.systemRole} />
                    <InviteStatusBadge status={member.inviteStatus} />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    {member.role && <span>{member.role}</span>}
                    {member.phone && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{member.phone}</span>
                      </>
                    )}
                    {member.email && (
                      <>
                        <span>·</span>
                        <span>{member.email}</span>
                      </>
                    )}
                    {member.specializations && member.specializations.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-primary/80">
                          {member.specializations.slice(0, 2).join(', ')}
                          {member.specializations.length > 2 && ` +${member.specializations.length - 2}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSchedulingStaff(member)}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}
                  className="text-xs h-8 border-border/60"
                >
                  <span className="hidden sm:inline">{t('staff.schedule_btn')}</span>
                </Button>

                <ActionsMenu
                  staff={member}
                  onEdit={() => setEditingStaff(member)}
                  onSchedule={() => setSchedulingStaff(member)}
                  onInvite={() => handleInvite(member)}
                  onRevoke={() => handleRevoke(member)}
                />
              </div>
            </div>
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
