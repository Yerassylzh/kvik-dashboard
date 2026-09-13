'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MailCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { verifyEmailApi, resendVerificationApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setPendingVerificationEmail, user, logout } = useAuth();
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const email = pendingEmail || user?.email;

  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If mounted and no email found → redirect to login
  useEffect(() => {
    if (mounted && !email) {
      router.replace('/login');
    }
  }, [mounted, email, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-focus first input once mounted
  useEffect(() => {
    if (mounted) {
      inputRefs.current[0]?.focus();
    }
  }, [mounted]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    setError(null);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    const next = Array(OTP_LENGTH).fill('');
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError(t('verify_email.error_fallback'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyEmailApi({ email, code });
      setSuccess(true);
      setPendingVerificationEmail(null);
      // Update user in store so isEmailVerified becomes true
      const { setUser, user } = useAuthStore.getState();
      if (user) setUser({ ...user, isEmailVerified: true });
      setTimeout(() => router.replace('/onboarding'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('verify_email.error_fallback'));
    } finally {
      setLoading(false);
    }
  }, [otp, email, t, router, setPendingVerificationEmail]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await resendVerificationApi({ email });
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      // Silently ignore
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    } finally {
      setPendingVerificationEmail(null);
      router.replace('/login');
    }
  };

  if (!mounted || !email) return null;

  return (
    <div>
      {/* Icon + Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <MailCheck className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t('verify_email.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {t('verify_email.subtitle')}{' '}
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {/* Success state */}
      {success && (
        <div className="mb-5 p-4 rounded-xl alert-success border text-sm flex items-center gap-3">
          <MailCheck className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{t('verify_email.success')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
          <span className="font-bold">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* OTP form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Цифра ${i + 1}`}
              className="w-11 h-14 text-center text-xl font-bold bg-card border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors caret-primary"
            />
          ))}
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={otp.join('').length < OTP_LENGTH || success}
          size="lg"
          className="w-full shadow-md"
        >
          {t('verify_email.submit_button')}
        </Button>
      </form>

      {/* Resend */}
      <div className="mt-5 text-center">
        {cooldown > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('verify_email.resend_countdown', { seconds: cooldown })}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-brand hover:underline disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            {t('verify_email.resend_button')}
          </button>
        )}
      </div>

      {/* Back link */}
      <div className="mt-6 pt-6 border-t border-border text-center">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('verify_email.back_to_login')}
        </button>
      </div>
    </div>
  );
}
