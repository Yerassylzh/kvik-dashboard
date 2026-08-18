'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Клиентский провайдер, монтируемый в корневом layout.
 * Единственная задача — запустить «тихий» refresh при старте приложения:
 * access token живёт только в памяти (Zustand), поэтому после перезагрузки
 * страницы его нужно восстановить из HttpOnly refresh-cookie до того, как
 * клиентские страницы (например, /onboarding) начнут дёргать защищённые API.
 *
 * useAuth() при монтировании вызывает checkAuth() → refresh → me.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}
