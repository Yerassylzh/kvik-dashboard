"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  businessContextApi,
  type BusinessContextDto,
  type UpdateBusinessContextDto,
} from '@/lib/api/businessContext';

export function useBusinessContext() {
  const {
    data: context,
    error,
    isLoading,
    mutate,
  } = useSWR<BusinessContextDto>(
    'knowledge-base/business-context',
    () => businessContextApi.getBusinessContext(),
    { revalidateOnFocus: true }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationQueued, setRegenerationQueued] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveContext = useCallback(
    async (payload: UpdateBusinessContextDto) => {
      setIsSaving(true);
      setSaveSuccess(false);
      try {
        const updated = await businessContextApi.updateBusinessContext(payload);
        await mutate(updated, false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        return updated;
      } finally {
        setIsSaving(false);
      }
    },
    [mutate]
  );

  const triggerRegeneration = useCallback(async () => {
    setIsRegenerating(true);
    setRegenerationQueued(false);
    try {
      const res = await businessContextApi.regenerateBusinessContext();
      setRegenerationQueued(true);
      return res;
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  return {
    context,
    isLoading,
    error,
    isSaving,
    isRegenerating,
    regenerationQueued,
    saveSuccess,
    saveContext,
    triggerRegeneration,
    refresh: mutate,
    clearQueueNotification: () => setRegenerationQueued(false),
  };
}
