import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ClaimWorkspaceForm } from '@/components/auth/ClaimWorkspaceForm';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Активация рабочего пространства — Kvik.ai',
  description: 'Привязка и активация преднастроенного рабочего пространства AI-ассистента',
};

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
