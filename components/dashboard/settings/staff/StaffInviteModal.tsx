'use client';

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateStaffPayload } from '@/lib/api/staff';
import type { SystemRole } from '@/types/auth';

interface StaffInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffPayload) => Promise<unknown>;
}

export function StaffInviteModal({ isOpen, onClose, onSubmit }: StaffInviteModalProps) {
  const t = useTranslations('dashboard');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemRole, setSystemRole] = useState<SystemRole>('SPECIALIST');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        role: role.trim() || undefined,
        systemRole,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        specializations: specializations
          ? specializations
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        sendInvite: Boolean(email.trim()),
      });

      // Reset & Close
      setName('');
      setRole('');
      setSystemRole('SPECIALIST');
      setEmail('');
      setPhone('');
      setSpecializations('');
      setAvatarUrl('');
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || t('staff.error_create_fallback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={t('staff.invite_modal_title')}
      description={t('staff.invite_modal_desc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff.field_name')} *
          </label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('staff.field_name_placeholder')}
            className="text-xs"
          />
        </div>

        {/* Position Title & System Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('staff.field_role')}
            </label>
            <Input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t('staff.field_role_placeholder')}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('staff.field_system_role')} *
            </label>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as SystemRole)}
              className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="SPECIALIST">{t('staff.system_role_specialist')}</option>
              <option value="ADMIN_MANAGER">{t('staff.system_role_manager')}</option>
            </select>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('staff.field_email')}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('staff.field_email_placeholder')}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('staff.field_phone')}
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('staff.field_phone_placeholder')}
              className="text-xs"
            />
          </div>
        </div>

        {/* Specializations */}
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

        {/* Avatar URL */}
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
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
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            {t('staff.add_btn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
