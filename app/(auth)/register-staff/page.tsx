import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterStaffForm } from '@/components/auth/RegisterStaffForm';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Регистрация сотрудника — Kvik.ai',
};

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
