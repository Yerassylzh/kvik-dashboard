'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Клиентский провайдер, монтируемый в корневом layout.
 * Единственная задача — запустить «тихий» refresh при старте приложения:
 * access token живёт только в памяти (Zustand), поэтому после перезагрузки
 * страницы его нужно восстановить из HttpOnly refresh-cookie до того, как
 * клиентские страницы (например, /onboarding) начнут дёргать защищённые API.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
