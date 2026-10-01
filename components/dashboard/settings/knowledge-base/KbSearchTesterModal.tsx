"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, FileText, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChunkSearchResultDto } from "@/types/knowledgeBase";

interface KbSearchTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSearching: boolean;
  results: ChunkSearchResultDto[] | null;
  error: string | null;
  onSearch: (query: string) => Promise<unknown>;
}

export function KbSearchTesterModal({
  isOpen,
  onClose,
  isSearching,
  results,
  error,
  onSearch,
}: KbSearchTesterModalProps) {
  const t = useTranslations("dashboard");
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("knowledge.search_tester_title")}
      width="lg"
    >
      <div className="space-y-4 pt-1">
        <p className="text-xs text-muted-foreground">
          {t("knowledge.search_tester_description")}
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("knowledge.search_query_placeholder")}
            className="flex-1 text-xs"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSearching}
            disabled={!query.trim()}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            {t("knowledge.search_button")}
          </Button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {results && results.length === 0 && (
            <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border/60">
              <Search className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">
                {t("knowledge.search_no_results")}
              </p>
            </div>
          )}

          {results && results.map((result, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-card border border-border/60 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0.5">
                    <Layers className="w-2.5 h-2.5 mr-1" />
                    Фрагмент #{result.chunkIndex + 1}
                  </Badge>
                  {result.knowledgeEntryTitle && (
                    <span className="text-xs font-semibold text-foreground truncate max-w-xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      {result.knowledgeEntryTitle}
                    </span>
                  )}
                </div>

                {result.similarity !== undefined && (
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg whitespace-pre-wrap font-sans leading-relaxed">
                {result.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
