'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Building2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateClaimWorkspaceApi } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';
import type { ValidateClaimWorkspaceResponse } from '@/types/auth';

export function ClaimWorkspaceForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { claimWorkspace } = useAuth();

  const [isValidating, setIsValidating] = useState(true);
  const [claimData, setClaimData] = useState<ValidateClaimWorkspaceResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      queueMicrotask(() => {
        setIsValidating(false);
        setValidationError(t('claim_workspace.missing_token'));
      });
      return;
    }

    (async () => {
      setIsValidating(true);
      setValidationError(null);
      try {
        const data = await validateClaimWorkspaceApi(token);
        if (!cancelled) {
          setClaimData(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            t('claim_workspace.invalid_desc');
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

    if (!claimData?.userExists && password.length < 8) {
      setSubmitError(t('claim_workspace.password_min_length'));
      return;
    }

    if (!claimData?.userExists && password !== confirmPassword) {
      setSubmitError(t('claim_workspace.password_mismatch'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await claimWorkspace({
        token,
        password: password.trim(),
      });

      // Route to onboarding (derived state will directly land on Step 5: CONNECT_CHANNEL)
      router.replace('/onboarding');
    } catch (err: unknown) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('claim_workspace.error_fallback')
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
          {t('claim_workspace.checking')}
        </p>
      </div>
    );
  }

  // State 2: Invalid or expired token
  if (validationError || !claimData) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {t('claim_workspace.invalid_title')}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {validationError || t('claim_workspace.invalid_desc')}
          </p>
        </div>

        <div className="pt-3">
          <Button
            type="button"
            onClick={() => router.replace('/login')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full text-xs font-semibold"
          >
            {t('claim_workspace.go_to_login')}
          </Button>
        </div>
      </div>
    );
  }

  // State 3: Valid token form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-1">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {claimData.userExists
              ? t('claim_workspace.badge_existing')
              : t('claim_workspace.badge_ready')}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          {claimData.userExists
            ? t('claim_workspace.title_existing')
            : t('claim_workspace.title_new')}
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {claimData.userExists
            ? t('claim_workspace.subtitle_existing')
            : t('claim_workspace.subtitle_new')}
        </p>
      </div>

      {/* Workspace Context Card */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-xs space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="font-bold text-foreground truncate">
              {claimData.workspaceName}
            </span>
          </div>
          {claimData.businessName && claimData.businessName !== claimData.workspaceName && (
            <span className="text-[11px] text-muted-foreground truncate">
              {claimData.businessName}
            </span>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
          <span className="font-bold">⚠️</span>
          <span className="flex-1">{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('claim_workspace.email_label')}
          type="email"
          value={claimData.email}
          disabled
          className="bg-muted/50 cursor-not-allowed font-medium text-muted-foreground"
        />

        <div className="space-y-1">
          <Input
            label={
              claimData.userExists
                ? t('claim_workspace.password_existing_label')
                : t('claim_workspace.password_new_label')
            }
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('claim_workspace.password_placeholder')}
            leftAddon={<Lock className="w-4 h-4" />}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
        </div>

        {!claimData.userExists && (
          <Input
            label={t('claim_workspace.confirm_password_label')}
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('claim_workspace.confirm_password_placeholder')}
            leftAddon={<Lock className="w-4 h-4" />}
          />
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full text-xs font-semibold mt-2"
        >
          {claimData.userExists
            ? t('claim_workspace.submit_existing')
            : t('claim_workspace.submit_new')}
        </Button>
      </form>
    </div>
  );
}
