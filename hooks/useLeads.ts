"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  leadsApi,
  type LeadStatus,
  type ChannelType,
  type FilterLeadsParams,
} from '@/lib/api/leads';

export function useLeads(initialParams?: FilterLeadsParams) {
  const [params, setParams] = useState<FilterLeadsParams>({
    page: 1,
    limit: 50,
    sortBy: 'lastActivityAt',
    sortOrder: 'desc',
    ...initialParams,
  });

  const {
    data: leadsData,
    error: leadsError,
    isLoading: leadsLoading,
    mutate: mutateLeads,
  } = useSWR(['leads', params], () => leadsApi.getLeads(params), {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  const {
    data: counts,
    error: countsError,
    isLoading: countsLoading,
    mutate: mutateCounts,
  } = useSWR('leads/counts', () => leadsApi.getCounts(), {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });

  const setStatus = useCallback((status?: LeadStatus) => {
    setParams((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSourceChannel = useCallback((sourceChannel?: ChannelType) => {
    setParams((prev) => ({ ...prev, sourceChannel, page: 1 }));
  }, []);

  const setSearch = useCallback((search?: string) => {
    setParams((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  }, []);

  const updateLeadStatus = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      // Optimistic update
      await mutateLeads(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((lead) =>
              lead.id === leadId ? { ...lead, status: newStatus } : lead
            ),
          };
        },
        { revalidate: false }
      );

      try {
        await leadsApi.updateStatus(leadId, newStatus);
        mutateCounts();
      } catch (err) {
        // Rollback
        mutateLeads();
        throw err;
      }
    },
    [mutateLeads, mutateCounts]
  );

  const archiveLead = useCallback(
    async (leadId: string) => {
      await updateLeadStatus(leadId, 'DEAL_LOST');
      await leadsApi.archiveLead(leadId);
      mutateLeads();
      mutateCounts();
    },
    [updateLeadStatus, mutateLeads, mutateCounts]
  );

  return {
    leads: leadsData?.data || [],
    total: leadsData?.total || 0,
    page: leadsData?.page || 1,
    limit: leadsData?.limit || 50,
    counts,
    params,
    setParams,
    setStatus,
    setSourceChannel,
    setSearch,
    updateLeadStatus,
    archiveLead,
    isLoading: leadsLoading || countsLoading,
    error: leadsError || countsError,
    refresh: () => {
      mutateLeads();
      mutateCounts();
    },
  };
}

export function useLeadDetail(leadId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    leadId ? ['lead', leadId] : null,
    () => (leadId ? leadsApi.getLead(leadId) : null)
  );

  return {
    lead: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
