'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  UserCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateStaffInviteApi } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';
import type { ValidateStaffInviteResponse } from '@/types/auth';

export function RegisterStaffForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { registerStaff } = useAuth();

  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<ValidateStaffInviteResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setIsValidating(false);
      setValidationError(t('staff_invite.missing_token'));
      return;
    }

    (async () => {
      setIsValidating(true);
      setValidationError(null);
      try {
        const data = await validateStaffInviteApi(token);
        if (!cancelled) {
          setInviteData(data);
          setName(data.staffName || '');
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg =
            err?.message ||
            t('staff_invite.token_not_found');
          setValidationError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setSubmitError(t('register.password_min_length'));
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError(t('register.password_mismatch'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerStaff({
        token,
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Staff bypasses owner onboarding, redirect directly to dashboard overview
      router.replace('/overview');
    } catch (err: any) {
      setSubmitError(
        err?.message || t('staff_invite.error_fallback')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // State 1: Validating token skeleton
  if (isValidating) {
    return (
      <div className="py-10 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          {t('staff_invite.checking')}
        </p>
      </div>
    );
  }

  // State 2: Invalid or expired token
  if (validationError || !inviteData) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {t('staff_invite.invalid_title')}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {validationError || t('staff_invite.invalid_desc')}
          </p>
        </div>

        <div className="pt-3">
          <Button
            type="button"
            onClick={() => router.replace('/login')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full text-xs font-semibold"
          >
            {t('staff_invite.go_to_login')}
          </Button>
        </div>
      </div>
    );
  }

  // State 3: Valid invitation form
  return (
    <div className="space-y-6">
      {/* Header & Workspace Card */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-1">
          <UserCheck className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          {t('staff_invite.title')}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t('staff_invite.subtitle')}
        </p>
      </div>

      {/* Inviter & Workspace Banner */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-xs space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="font-bold text-foreground truncate">
              {inviteData.workspaceName}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold shrink-0">
            {inviteData.systemRole === 'ADMIN_MANAGER'
              ? t('staff_invite.role_admin_manager')
              : t('staff_invite.role_specialist')}
          </span>
        </div>

        {inviteData.inviterName && (
          <p className="text-[11px] text-muted-foreground">
            {t('staff_invite.invited_by')}{' '}
            <span className="text-foreground font-medium">{inviteData.inviterName}</span>
          </p>
        )}
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className="p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
          <span className="font-bold">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email (Readonly) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff_invite.email_label')}
          </label>
          <Input
            type="email"
            value={inviteData.email}
            disabled
            className="opacity-70 bg-muted/50 cursor-not-allowed text-xs font-mono"
          />
        </div>

        {/* Display Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff_invite.name_label')} *
          </label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('staff_invite.name_placeholder')}
            className="text-xs"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff_invite.password_label')} *
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('staff_invite.password_placeholder')}
              className="text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            {t('staff_invite.confirm_password_label')} *
          </label>
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('staff_invite.confirm_password_placeholder')}
            className="text-xs"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={!name.trim() || !password || !confirmPassword}
          leftIcon={<ShieldCheck className="w-4 h-4" />}
          className="w-full shadow-md text-xs font-bold mt-2"
        >
          {t('staff_invite.submit')}
        </Button>
      </form>
    </div>
  );
}
