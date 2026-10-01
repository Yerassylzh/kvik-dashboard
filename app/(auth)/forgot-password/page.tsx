'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPasswordApi, resetPasswordApi } from '@/lib/api/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Step = 1 | 2 | 3 | 'done';

const OTP_LENGTH = 6;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // --- Step 1: Send OTP ---
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPasswordApi({ email });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgot_password.error_fallback'));
    } finally {
      setLoading(false);
    }
  };

  // --- OTP helpers ---
  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    setError(null);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // --- Step 2: Validate OTP (just advance to step 3) ---
  const handleStep2 = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.join('').length < OTP_LENGTH) {
      setError(t('forgot_password.error_fallback'));
      return;
    }
    setError(null);
    setStep(3);
  }, [otp, t]);

  // --- Step 3: Reset Password ---
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t('forgot_password.step3_password_mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('forgot_password.step3_password_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi({ email, code: otp.join(''), newPassword });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgot_password.error_fallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t('forgot_password.step1_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('forgot_password.step1_subtitle')}
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t('forgot_password.step2_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('forgot_password.step2_subtitle')}{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t('forgot_password.step3_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('forgot_password.step3_subtitle')}
            </p>
          </>
        )}
        {step === 'done' && (
          <>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t('forgot_password.success_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('forgot_password.success_subtitle')}
            </p>
          </>
        )}
      </div>

      {/* Progress dots */}
      {step !== 'done' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s
                  ? 'w-6 bg-primary'
                  : (typeof step === 'number' && step > s)
                    ? 'w-3 bg-primary/40'
                    : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
          <span className="font-bold">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <Input
            label={t('forgot_password.step1_email_label')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgot_password.step1_email_placeholder')}
          />
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2 shadow-md">
            {t('forgot_password.step1_submit')}
          </Button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div className="flex items-center justify-center gap-2.5">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i]}
                onChange={(ev) => handleOtpChange(i, ev.target.value)}
                onKeyDown={(ev) => handleOtpKeyDown(i, ev)}
                onPaste={handlePaste}
                aria-label={t('layout.otp_digit', { number: i + 1 })}
                className="w-11 h-14 text-center text-xl font-bold bg-card border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors caret-primary"
              />
            ))}
          </div>
          <Button
            type="submit"
            disabled={otp.join('').length < OTP_LENGTH}
            size="lg"
            className="w-full shadow-md"
          >
            {t('forgot_password.step2_submit')}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(Array(OTP_LENGTH).fill('')); setError(null); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              ← {t('layout.back')}
            </button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-4">
          <Input
            label={t('forgot_password.step3_password_label')}
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('forgot_password.step3_password_placeholder')}
          />
          <Input
            label={t('forgot_password.step3_confirm_label')}
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('forgot_password.step3_confirm_placeholder')}
          />
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2 shadow-md">
            {t('forgot_password.step3_submit')}
          </Button>
        </form>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <Button
            size="lg"
            className="w-full shadow-md"
            onClick={() => router.replace('/login')}
          >
            {t('forgot_password.success_login_btn')}
          </Button>
        </div>
      )}

      {/* Back to login */}
      {step !== 'done' && (
        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('forgot_password.back_to_login')}
          </Link>
        </div>
      )}
    </div>
  );
}
