"use client";

import React, { useState } from "react";
import { Eye, Trash2, Globe, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { KbContentInspectorModal } from "../KbContentInspectorModal";
import { knowledgeBaseApi, type KnowledgeEntryDto } from "@/lib/api/knowledgeBase";

interface KbScrapedEntriesTableProps {
  entries: KnowledgeEntryDto[];
  isLoading: boolean;
  type: "WEBSITE_CONTENT" | "LOCAL_LISTING" | "DOCUMENT";
  onRefresh: () => void;
}

export function KbScrapedEntriesTable({
  entries,
  isLoading,
  type,
  onRefresh,
}: KbScrapedEntriesTableProps) {
  const t = useTranslations("dashboard");
  const [inspectEntry, setInspectEntry] = useState<KnowledgeEntryDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await knowledgeBaseApi.updateEntry(id, { active: !currentActive });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle entry active status", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await knowledgeBaseApi.deleteEntry(deletingId);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete entry", err);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
        {t("common.loading")}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl">
        {type === "WEBSITE_CONTENT"
          ? t("knowledge.no_website_pages")
          : t("knowledge.no_twogis_items")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
        <span>
          {type === "WEBSITE_CONTENT"
            ? `${t("knowledge.scanned_pages_title")} (${entries.length})`
            : `${t("knowledge.catalog_items_title")} (${entries.length})`}
        </span>
      </div>

      <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/50 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3.5">
                  {type === "WEBSITE_CONTENT" ? t("knowledge.table_col_page") : t("knowledge.table_col_service")}
                </th>
                <th className="py-2.5 px-3 text-center">{t("knowledge.status")}</th>
                <th className="py-2.5 px-3 text-center">{t("knowledge.active")}</th>
                <th className="py-2.5 px-3 text-right">{t("knowledge.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {entries.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3.5 max-w-xs sm:max-w-md">
                    <div className="flex items-start gap-2">
                      {type === "WEBSITE_CONTENT" ? (
                        <Globe className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {item.title || item.sourceUrl || t("knowledge.untitled")}
                        </p>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-primary truncate block font-mono"
                          >
                            {item.sourceUrl}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <Badge
                      variant={
                        item.processingStatus === "COMPLETED"
                          ? "success"
                          : item.processingStatus === "FAILED"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-[10px] px-1.5 py-0.2"
                    >
                      {item.processingStatus}
                    </Badge>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id, item.active)}
                      className={clsx(
                        "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        item.active ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={clsx(
                          "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          item.active ? "translate-x-3" : "translate-x-0"
                        )}
                      />
                    </button>
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectEntry(item)}
                        leftIcon={<Eye className="w-3 h-3 text-primary" />}
                        className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
                        title={t("knowledge.inspect_data")}
                      >
                        {t("knowledge.inspect_data_btn")}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(item.id)}
                        className="text-xs h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Inspector Modal */}
      <KbContentInspectorModal
        isOpen={Boolean(inspectEntry)}
        onClose={() => setInspectEntry(null)}
        entryId={inspectEntry?.id || null}
        initialEntry={inspectEntry}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={t("knowledge.confirm_delete_entry_title")}
        description={t("knowledge.confirm_delete_entry_desc")}
      />
    </div>
  );
}
