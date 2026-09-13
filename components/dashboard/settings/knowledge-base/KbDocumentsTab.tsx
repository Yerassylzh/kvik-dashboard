"use client";

import React, { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { KbDropzone } from "./docs/KbDropzone";
import { KbDocumentRow } from "./docs/KbDocumentRow";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { KbContentInspectorModal } from "./KbContentInspectorModal";
import { knowledgeBaseApi, type KnowledgeDocumentDto } from "@/lib/api/knowledgeBase";

interface KbDocumentsTabProps {
  documents: KnowledgeDocumentDto[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbDocumentsTab({ documents, isLoading, onRefresh }: KbDocumentsTabProps) {
  const t = useTranslations("dashboard");

  const [isUploading, setIsUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Confirmation & Inspector modal states
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);
  const [inspectDocId, setInspectDocId] = useState<string | null>(null);

  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        await knowledgeBaseApi.uploadDocument(file);
      }
      onRefresh();
    } catch (err) {
      console.error("Failed to upload document", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (doc: KnowledgeDocumentDto) => {
    try {
      await knowledgeBaseApi.updateEntry(doc.id, { active: !doc.active });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle document active state", err);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await knowledgeBaseApi.reindexEntry(id);
      onRefresh();
    } catch (err) {
      console.error("Failed to reindex document", err);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingDocId) return;
    try {
      await knowledgeBaseApi.deleteEntry(deletingDocId);
      setSelectedIds((prev) => prev.filter((item) => item !== deletingDocId));
      onRefresh();
    } catch (err) {
      console.error("Failed to delete document", err);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await knowledgeBaseApi.bulkDeleteEntries(selectedIds);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error("Failed to bulk delete documents", err);
    } finally {
      setIsBulkDeleting(false);
      setIsConfirmBulkOpen(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t("knowledge.docs_title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("knowledge.docs_description")}
          </p>
        </div>

        {selectedIds.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsConfirmBulkOpen(true)}
            loading={isBulkDeleting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t("knowledge.bulk_delete")} ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Upload Dropzone */}
      <KbDropzone isUploading={isUploading} onUploadFiles={handleUploadFiles} />

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border/60">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs font-medium text-muted-foreground">
            {t("knowledge.no_documents")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === documents.length && documents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="p-3">{t("knowledge.file_name")}</th>
                  <th className="p-3">{t("knowledge.file_size")}</th>
                  <th className="p-3">{t("knowledge.status")}</th>
                  <th className="p-3">{t("knowledge.active")}</th>
                  <th className="p-3 text-right">{t("knowledge.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {documents.map((doc) => (
                  <KbDocumentRow
                    key={doc.id}
                    document={doc}
                    isSelected={selectedIds.includes(doc.id)}
                    onToggleSelect={toggleSelect}
                    onToggleActive={handleToggleActive}
                    onReindex={handleReindex}
                    onDelete={(id) => setDeletingDocId(id)}
                    onInspect={(id) => setInspectDocId(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Content Inspector Modal */}
      <KbContentInspectorModal
        isOpen={Boolean(inspectDocId)}
        onClose={() => setInspectDocId(null)}
        entryId={inspectDocId}
      />

      {/* Single Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingDocId)}
        onClose={() => setDeletingDocId(null)}
        onConfirm={handleConfirmSingleDelete}
        title={t("knowledge.confirm_delete_doc_title")}
        description={t("knowledge.confirm_delete_doc_desc")}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmBulkOpen}
        onClose={() => setIsConfirmBulkOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        isLoading={isBulkDeleting}
        title={t("knowledge.confirm_bulk_delete_title")}
        description={t("knowledge.confirm_bulk_delete_desc")}
      />
    </div>
  );
}
