'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('register.password_mismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.password_min_length'));
      return;
    }

    setLoading(true);

    try {
      await register({ email, password });
      router.replace('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error_fallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t('register.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('register.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl alert-destructive border text-xs flex items-start gap-2 shadow-xs">
          <span className="font-bold">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('register.email_label')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('register.email_placeholder')}
        />

        <Input
          label={t('register.password_label')}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('register.password_placeholder')}
        />

        <Input
          label={t('register.confirm_password_label')}
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('register.confirm_password_placeholder')}
        />

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full mt-2 shadow-md"
        >
          {t('register.submit_button')}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        {t('register.has_account')}{' '}
        <Link href="/login" className="font-semibold text-accent-brand hover:underline transition-colors">
          {t('register.login_link')}
        </Link>
      </div>
    </div>
  );
}
