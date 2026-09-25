'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { getMeApi } from '@/lib/api/auth';
import { getOnboardingState } from '@/lib/api/onboarding';
import { Loader2 } from 'lucide-react';

function AuthHandoffContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken) {
      router.replace('/login');
      return;
    }

    // 1. Ingest tokens into auth store and set refresh cookie if provided
    useAuthStore.getState().setTokens(accessToken, refreshToken || undefined);

    // 2. Clean URL immediately to prevent token exposure in browser history
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 3. Set BFF cookies and hydrate session
    (async () => {
      try {
        // Sync cookies on server side via BFF route
        await fetch('/api/auth/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: accessToken, refreshToken: refreshToken || '' }),
        });

        const userData = await getMeApi();
        useAuthStore.getState().setUser(userData);

        try {
          const stateRes = await getOnboardingState();
          if (stateRes.step === 'DONE' || stateRes.step === 'COMPLETE_TEST') {
            router.replace('/overview');
          } else {
            router.replace('/onboarding');
          }
        } catch {
          // If onboarding state lookup encounters an error, fallback to onboarding
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('Auth handoff hydration error:', err);
        useAuthStore.getState().clearAuth();
        router.replace('/login');
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground p-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t('handoff.switching')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('handoff.loading')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthHandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <AuthHandoffContent />
    </Suspense>
  );
}
