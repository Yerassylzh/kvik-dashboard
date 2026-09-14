"use client";

import React from "react";
import { FileText, Trash2, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeDocumentDto } from "@/types/knowledgeBase";

interface KbDocumentRowProps {
  document: KnowledgeDocumentDto;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleActive: (doc: KnowledgeDocumentDto) => void;
  onReindex: (id: string) => void;
  onDelete: (id: string) => void;
  onInspect: (id: string) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function KbDocumentRow({
  document: doc,
  isSelected,
  onToggleSelect,
  onToggleActive,
  onReindex,
  onDelete,
  onInspect,
}: KbDocumentRowProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <tr
      className={`hover:bg-muted/20 transition-colors ${
        !doc.active ? "opacity-60 bg-muted/5" : ""
      }`}
    >
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(doc.id)}
          className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm text-foreground max-w-xs truncate">
            {doc.fileName || t("knowledge.doc_fallback")}
          </span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground font-mono text-[11px]">
        {formatBytes(doc.fileSize)}
      </td>
      <td className="p-3">
        {doc.processingStatus === "COMPLETED" && (
          <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            {tCommon("status_completed")}
          </Badge>
        )}
        {doc.processingStatus === "PROCESSING" && (
          <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
            <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
            {tCommon("status_processing")}
          </Badge>
        )}
        {doc.processingStatus === "PENDING" && (
          <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
            <Clock className="w-2.5 h-2.5 mr-1" />
            {tCommon("status_pending")}
          </Badge>
        )}
        {doc.processingStatus === "FAILED" && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
            <AlertCircle className="w-2.5 h-2.5 mr-1" />
            {tCommon("status_failed")}
          </Badge>
        )}
      </td>
      <td className="p-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={doc.active}
            onClick={() => onToggleActive(doc)}
            className={clsx(
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              doc.active ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={clsx(
                "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                doc.active ? "translate-x-3" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-[11px] text-muted-foreground">
            {doc.active ? t("knowledge.active_enabled") : t("knowledge.active_disabled")}
          </span>
        </label>
      </td>
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Просмотр извлеченных данных"
            onClick={() => onInspect(doc.id)}
            className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
          >
            Данные
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={t("knowledge.reindex")}
            onClick={() => onReindex(doc.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={t("knowledge.delete")}
            onClick={() => onDelete(doc.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
