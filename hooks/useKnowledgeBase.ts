"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  knowledgeBaseApi,
  type KnowledgeBaseStatsDto,
  type KnowledgeDocumentDto,
  type ManualNoteDto,
  type ScrapersStatusDto,
  type QualificationRulesDto,
  type ChunkSearchResultDto,
} from '@/lib/api/knowledgeBase';

export function useKnowledgeBase() {
  // 1. Stats (Polls if any pending/processing jobs exist)
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
    mutate: mutateStats,
  } = useSWR<KnowledgeBaseStatsDto>(
    'knowledge-base/stats',
    () => knowledgeBaseApi.getStats(),
    {
      revalidateOnFocus: true,
      refreshInterval: (data) => {
        const hasPending =
          (data?.statusSummary?.PENDING ?? 0) > 0 ||
          (data?.statusSummary?.PROCESSING ?? 0) > 0;
        return hasPending ? 3000 : 0;
      },
    }
  );

  // 2. Documents (Polls if any document is being parsed/indexed)
  const {
    data: documents = [],
    error: docsError,
    isLoading: isDocsLoading,
    mutate: mutateDocuments,
  } = useSWR<KnowledgeDocumentDto[]>(
    'knowledge-base/documents',
    () => knowledgeBaseApi.getDocuments(),
    {
      revalidateOnFocus: true,
      refreshInterval: (data) => {
        const hasPending = data?.some(
          (d) => d.processingStatus === 'PENDING' || d.processingStatus === 'PROCESSING'
        );
        return hasPending ? 3000 : 0;
      },
    }
  );

  // 3. Manual Notes (Polls if any note is being structured/indexed)
  const {
    data: notes = [],
    error: notesError,
    isLoading: isNotesLoading,
    mutate: mutateNotes,
  } = useSWR<ManualNoteDto[]>(
    'knowledge-base/notes',
    () => knowledgeBaseApi.getNotes(),
    {
      revalidateOnFocus: true,
      refreshInterval: (data) => {
        const hasPending = data?.some(
          (n) => n.processingStatus === 'PENDING' || n.processingStatus === 'PROCESSING'
        );
        return hasPending ? 3000 : 0;
      },
    }
  );

  // 4. Scrapers Status (Polls every 4s if any scraper is active)
  const {
    data: scrapersStatus,
    error: scrapersError,
    isLoading: isScrapersLoading,
    mutate: mutateScrapers,
  } = useSWR<ScrapersStatusDto>(
    'knowledge-base/scrapers/status',
    () => knowledgeBaseApi.getScrapersStatus(),
    {
      refreshInterval: (data) => {
        const isWebScraping =
          data?.website?.status === 'PROCESSING' || data?.website?.status === 'QUEUED';
        const isTwoGisScraping =
          data?.twoGis?.status === 'PROCESSING' || data?.twoGis?.status === 'QUEUED';
        return isWebScraping || isTwoGisScraping ? 3000 : 0;
      },
    }
  );

  // 5. Qualification Rules
  const {
    data: qualificationData,
    error: qualificationError,
    isLoading: isQualificationLoading,
    mutate: mutateQualification,
  } = useSWR<QualificationRulesDto>(
    'knowledge-base/qualification',
    () => knowledgeBaseApi.getQualification(),
    { revalidateOnFocus: true }
  );

  // 6. Direct Semantic Search Test state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChunkSearchResultDto[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const runSearchTest = useCallback(async (query: string, k = 5) => {
    if (!query.trim()) return null;
    setIsSearching(true);
    setSearchError(null);
    setSearchQuery(query);
    try {
      const res = await knowledgeBaseApi.testSearch(query, k);
      setSearchResults(res.results || []);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search test failed';
      setSearchError(msg);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    mutateStats();
    mutateDocuments();
    mutateNotes();
    mutateScrapers();
    mutateQualification();
  }, [mutateStats, mutateDocuments, mutateNotes, mutateScrapers, mutateQualification]);

  return {
    // Stats
    stats,
    isStatsLoading,
    statsError,
    mutateStats,

    // Documents
    documents,
    isDocsLoading,
    docsError,
    mutateDocuments,

    // Notes
    notes,
    isNotesLoading,
    notesError,
    mutateNotes,

    // Scrapers
    scrapersStatus,
    isScrapersLoading,
    scrapersError,
    mutateScrapers,

    // Qualification
    qualificationData,
    isQualificationLoading,
    qualificationError,
    mutateQualification,

    // Search Sandbox
    isSearching,
    searchResults,
    searchQuery,
    searchError,
    runSearchTest,
    clearSearch: () => {
      setSearchResults(null);
      setSearchError(null);
      setSearchQuery('');
    },

    refreshAll,
  };
}
