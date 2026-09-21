"use client";

import useSWR from "swr";
import { useState } from "react";
import {
  conversationsApi,
  type MediaType,
  type MediaItemDto,
} from "@/lib/api/conversations";

export type MediaFilterType = "ALL" | MediaType;

export function useMediaGallery(conversationId: string | null) {
  const [filterType, setFilterType] = useState<MediaFilterType>("ALL");

  const queryParams = {
    type: filterType !== "ALL" ? filterType : undefined,
    limit: 50,
  };

  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? ["conversation/media", conversationId, filterType] : null,
    () =>
      conversationId
        ? conversationsApi.getMediaGallery(conversationId, queryParams)
        : null,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    mediaItems: data?.data || [],
    total: data?.total || 0,
    filterType,
    setFilterType,
    isLoading,
    error,
    refresh: mutate,
  };
}
