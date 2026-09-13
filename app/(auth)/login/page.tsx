'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { getOnboardingState } from '@/lib/api/onboarding';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '';

  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (user && !user.isEmailVerified) {
        router.replace('/verify-email');
      } else {
        router.replace(from || '/onboarding');
      }
    }
  }, [isAuthenticated, user, from, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      
      try {
        const stateRes = await getOnboardingState();
        if (stateRes.step === 'DONE') {
          router.replace(from || '/');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace(from || '/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error_fallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t('login.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('login.subtitle')}
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
          label={t('login.email_label')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.email_placeholder')}
        />

        <Input
          label={t('login.password_label')}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.password_placeholder')}
        />

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full mt-2 shadow-md"
        >
          {t('login.submit_button')}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {t('login.forgot_password')}
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        {t('login.no_account')}{' '}
        <Link href="/register" className="font-semibold text-accent-brand hover:underline transition-colors">
          {t('login.register_link')}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Загрузка...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
