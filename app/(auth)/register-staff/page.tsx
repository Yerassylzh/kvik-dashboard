import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegisterStaffForm } from '@/components/auth/RegisterStaffForm';
import { Loader2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: `${t('staff_invite.title')} — Kvik.ai`,
  };
}

export default function RegisterStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        </div>
      }
    >
      <RegisterStaffForm />
    </Suspense>
  );
}
