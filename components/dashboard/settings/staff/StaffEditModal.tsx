'use client';

import React, { useState, useEffect } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StaffDto, UpdateStaffPayload } from '@/lib/api/staff';
import type { SystemRole } from '@/types/auth';

interface StaffEditModalProps {
  staff: StaffDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateStaffPayload) => Promise<unknown>;
  onDeactivate: (id: string) => Promise<unknown>;
}

export function StaffEditModal({
  staff,
  isOpen,
  onClose,
  onSubmit,
  onDeactivate,
}: StaffEditModalProps) {
  const t = useTranslations('dashboard');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemRole, setSystemRole] = useState<SystemRole>('SPECIALIST');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setRole(staff.role || '');
      setSystemRole(staff.systemRole || 'SPECIALIST');
      setEmail(staff.email || '');
      setPhone(staff.phone || '');
      setSpecializations((staff.specializations || []).join(', '));
      setAvatarUrl(staff.avatarUrl || '');
      setIsActive(staff.isActive);
      setConfirmDeactivate(false);
      setError(null);
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(staff.id, {
        name: name.trim(),
        role: role.trim() || undefined,
        systemRole,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        specializations: specializations
          ? specializations.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || t('staff.error_save_fallback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }
    setIsDeactivating(true);
    try {
      await onDeactivate(staff.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || t('staff.error_deactivate_fallback'));
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={t('staff.edit_modal_title_prefix', { name: staff.name })}
      description={t('staff.edit_modal_desc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{t('staff.field_name')} *</label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t('staff.field_role')}</label>
            <Input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t('staff.field_role_placeholder')}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t('staff.field_system_role')}</label>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as SystemRole)}
              className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="SPECIALIST">{t('staff.role_specialist')}</option>
              <option value="ADMIN_MANAGER">{t('staff.role_admin_manager')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t('staff.field_email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t('staff.field_phone')}</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff.field_specializations')}
          </label>
          <Input
            type="text"
            value={specializations}
            onChange={(e) => setSpecializations(e.target.value)}
            placeholder={t('staff.field_specializations_placeholder')}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff.field_avatar')}
          </label>
          <Input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t('staff.field_avatar_placeholder')}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60">
          <input
            id="isActiveToggle"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
          />
          <label htmlFor="isActiveToggle" className="text-xs font-medium text-foreground cursor-pointer">
            {t('staff.field_is_active')}
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeactivate}
            loading={isDeactivating}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className={`text-xs ${
              confirmDeactivate
                ? 'border-destructive text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground'
            }`}
          >
            {confirmDeactivate ? t('staff.action_confirm_deactivate') : t('staff.action_deactivate')}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t('staff.cancel_btn')}
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting}
              disabled={!name.trim()}
              leftIcon={<Save className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              {t('staff.save_btn')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
