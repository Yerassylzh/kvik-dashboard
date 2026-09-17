"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  leadsApi,
  type LeadStatus,
  type ChannelType,
  type LeadLossReason,
  type FilterLeadsParams,
  type LeadCountsResponseDto,
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
  } = useSWR<LeadCountsResponseDto>('leads/counts', () => leadsApi.getCounts(), {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });

  const setStatus = useCallback((status?: LeadStatus) => {
    setParams((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSourceChannel = useCallback((sourceChannel?: ChannelType) => {
    setParams((prev) => ({ ...prev, sourceChannel, page: 1 }));
  }, []);

  const setAssignedStaffId = useCallback((assignedStaffId?: string) => {
    setParams((prev) => ({ ...prev, assignedStaffId: assignedStaffId || undefined, page: 1 }));
  }, []);

  const setLossReason = useCallback((lossReason?: LeadLossReason) => {
    setParams((prev) => ({ ...prev, lossReason: lossReason || undefined, page: 1 }));
  }, []);

  const setSort = useCallback((
    sortBy?: 'lastActivityAt' | 'createdAt' | 'stageChangedAt' | 'score',
    sortOrder?: 'asc' | 'desc'
  ) => {
    setParams((prev) => ({
      ...prev,
      sortBy: sortBy || prev.sortBy,
      sortOrder: sortOrder || prev.sortOrder,
    }));
  }, []);

  const setSearch = useCallback((search?: string) => {
    setParams((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  }, []);

  const updateLeadStatus = useCallback(
    async (
      leadId: string,
      newStatus: LeadStatus,
      opts?: { reason?: string; lossReason?: LeadLossReason | null }
    ) => {
      // Optimistic update
      await mutateLeads(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((lead) =>
              lead.id === leadId
                ? {
                    ...lead,
                    status: newStatus,
                    lossReason: newStatus === 'DEAL_LOST' ? opts?.lossReason || lead.lossReason : null,
                  }
                : lead
            ),
          };
        },
        { revalidate: false }
      );

      try {
        await leadsApi.updateStatus(leadId, newStatus, opts);
        mutateCounts();
      } catch (err) {
        // Rollback
        mutateLeads();
        throw err;
      }
    },
    [mutateLeads, mutateCounts]
  );

  const disqualifyLead = useCallback(
    async (leadId: string, lossReason: LeadLossReason, lossNotes?: string) => {
      await updateLeadStatus(leadId, 'DEAL_LOST', { lossReason, reason: lossNotes });
      try {
        await leadsApi.disqualifyLead(leadId, { lossReason, lossNotes });
        mutateLeads();
        mutateCounts();
      } catch (err) {
        mutateLeads();
        throw err;
      }
    },
    [updateLeadStatus, mutateLeads, mutateCounts]
  );

  const qualifyLead = useCallback(
    async (
      leadId: string,
      payload: {
        serviceInterest?: string;
        preferredStaffId?: string;
        budget?: number;
        notes?: string;
      }
    ) => {
      await updateLeadStatus(leadId, 'QUALIFIED');
      try {
        await leadsApi.qualifyLead(leadId, payload);
        mutateLeads();
        mutateCounts();
      } catch (err) {
        mutateLeads();
        throw err;
      }
    },
    [updateLeadStatus, mutateLeads, mutateCounts]
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
    setAssignedStaffId,
    setLossReason,
    setSort,
    setSearch,
    updateLeadStatus,
    disqualifyLead,
    qualifyLead,
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

  const updateLead = useCallback(
    async (payload: {
      name?: string;
      phone?: string;
      email?: string;
      assignedStaffId?: string | null;
      score?: number;
      nicheData?: Record<string, unknown>;
    }) => {
      if (!leadId) return;
      const res = await leadsApi.updateLead(leadId, payload);
      mutate();
      return res;
    },
    [leadId, mutate]
  );

  return {
    lead: data,
    isLoading,
    error,
    updateLead,
    refresh: mutate,
  };
}

export function useLeadTimeline(leadId: string | null, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    leadId ? ['lead-timeline', leadId, page] : null,
    () => (leadId ? leadsApi.getTimeline(leadId, { page, limit: 20 }) : null),
    { revalidateOnFocus: true }
  );

  return {
    events: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || 20,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useLeadNotes(leadId: string | null, onMutateLead?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addNote = useCallback(
    async (content: string, isPinned = false) => {
      if (!leadId || !content.trim()) return;
      setIsSubmitting(true);
      try {
        const res = await leadsApi.createNote(leadId, { content: content.trim(), isPinned });
        if (onMutateLead) onMutateLead();
        return res;
      } finally {
        setIsSubmitting(false);
      }
    },
    [leadId, onMutateLead]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!leadId || !noteId) return;
      setIsSubmitting(true);
      try {
        const res = await leadsApi.deleteNote(leadId, noteId);
        if (onMutateLead) onMutateLead();
        return res;
      } finally {
        setIsSubmitting(false);
      }
    },
    [leadId, onMutateLead]
  );

  return {
    addNote,
    deleteNote,
    isSubmitting,
  };
}

export function useFunnelAnalytics(params?: { from?: string; to?: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    ['leads-funnel', params?.from, params?.to],
    () => leadsApi.getFunnel(params),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    }
  );

  return {
    funnel: data?.funnel || [],
    period: data?.period,
    overallConversionRate: data?.overallConversionRate ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

