import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClaimWorkspaceForm } from '@/components/auth/ClaimWorkspaceForm';
import { Loader2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: `${t('claim_workspace.title_new')} — Kvik.ai`,
    description: t('claim_workspace.subtitle_new'),
  };
}

export default function ClaimWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        </div>
      }
    >
      <ClaimWorkspaceForm />
    </Suspense>
  );
}
