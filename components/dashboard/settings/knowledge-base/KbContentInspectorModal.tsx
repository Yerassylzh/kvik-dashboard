"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Globe,
  MapPin,
  StickyNote,
  ExternalLink,
  Copy,
  Check,
  Download,
  Sparkles,
  Code,
} from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KbStructuredTextView } from "./inspector/KbStructuredTextView";
import { KbRawJsonView } from "./inspector/KbRawJsonView";
import { knowledgeBaseApi, type KnowledgeEntryDto } from "@/lib/api/knowledgeBase";

interface KbContentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string | null;
  initialEntry?: KnowledgeEntryDto | null;
}

type InspectorTab = "structured" | "raw";

export function KbContentInspectorModal({
  isOpen,
  onClose,
  entryId,
  initialEntry,
}: KbContentInspectorModalProps) {
  const t = useTranslations("dashboard");
  const [entry, setEntry] = useState<KnowledgeEntryDto | null>(initialEntry || null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>("structured");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && entryId) {
      setIsLoading(true);
      knowledgeBaseApi
        .getEntry(entryId)
        .then((data) => {
          setEntry(data);
        })
        .catch((err) => {
          console.error("Failed to load entry details", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (initialEntry) {
      setEntry(initialEntry);
    }
  }, [isOpen, entryId, initialEntry]);

  // Extract human readable structured text
  const extractedText = useMemo(() => {
    if (!entry) return "";
    const d = entry.data;
    if (!d) return entry.title || "";
    if (typeof d === "string") return d;
    if (typeof d.text === "string") return d.text;
    if (typeof d.content === "string") return d.content;
    if (typeof d.markdown === "string") return d.markdown;
    if (typeof d.note === "string") return d.note;
    if (typeof d.rawText === "string") return d.rawText;
    if (typeof d.description === "string") return d.description;

    if (Array.isArray(d)) {
      return d.map((item, idx) => `${idx + 1}. ${typeof item === "object" ? JSON.stringify(item) : item}`).join("\n");
    }

    return Object.entries(d)
      .map(([k, v]) => `• ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n\n");
  }, [entry]);

  // Extract structured key-value entities
  const structuredEntities = useMemo(() => {
    if (!entry?.data || typeof entry.data !== "object") return null;
    const d = entry.data;
    const entities: { label: string; value: string }[] = [];

    if (d.title) entities.push({ label: t("knowledge.title_label"), value: String(d.title) });
    if (d.price) entities.push({ label: t("knowledge.price_label"), value: String(d.price) });
    if (d.category) entities.push({ label: t("knowledge.category_label"), value: String(d.category) });
    if (d.duration) entities.push({ label: t("knowledge.duration_label"), value: String(d.duration) });
    if (d.address) entities.push({ label: t("knowledge.address_label"), value: String(d.address) });
    if (d.phone) entities.push({ label: t("knowledge.phone_label"), value: String(d.phone) });

    return entities.length > 0 ? entities : null;
  }, [entry, t]);

  const rawJsonString = useMemo(() => {
    if (!entry) return "{}";
    return JSON.stringify(
      {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        active: entry.active,
        processingStatus: entry.processingStatus,
        sourceUrl: entry.sourceUrl,
        fileKey: entry.fileKey,
        fileMimeType: entry.fileMimeType,
        fileSize: entry.fileSize,
        createdAt: entry.createdAt,
        data: entry.data,
      },
      null,
      2
    );
  }, [entry]);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = activeTab === "raw";
    const content = isJson ? rawJsonString : extractedText;
    const blob = new Blob([content], {
      type: isJson ? "application/json;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitized = (entry?.title || "knowledge_entry").replace(/[^a-z0-9а-яё_-]/gi, "_");
    link.href = url;
    link.download = `${sanitized}.${isJson ? "json" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getIcon = () => {
    switch (entry?.type) {
      case "WEBSITE_CONTENT":
        return <Globe className="w-4 h-4 text-indigo-500" />;
      case "LOCAL_LISTING":
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case "MANUAL_NOTE":
        return <StickyNote className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry?.title || t("knowledge.inspector_title")}
      description={t("knowledge.inspector_desc")}
      width="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Header Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-bold text-foreground truncate max-w-xs sm:max-w-sm">
              {entry?.title || t("knowledge.untitled")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={entry?.processingStatus === "COMPLETED" ? "success" : "warning"}
              className="text-[10px] px-2 py-0.5"
            >
              {entry?.processingStatus || "COMPLETED"}
            </Badge>

            <span className="text-[11px] font-medium text-muted-foreground">
              {entry?.active ? (
                <span className="text-emerald-500 font-semibold">● {t("knowledge.active_enabled")}</span>
              ) : (
                <span className="text-muted-foreground">○ {t("knowledge.active_disabled")}</span>
              )}
            </span>
          </div>
        </div>

        {/* Source URL if present */}
        {entry?.sourceUrl && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border/40 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-muted-foreground shrink-0 font-medium">{t("knowledge.link_label")}:</span>
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono truncate text-[11px]"
              >
                {entry.sourceUrl}
              </a>
            </div>
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("structured")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                activeTab === "structured"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/40"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("knowledge.tab_structured")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                activeTab === "raw"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/40"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{t("knowledge.tab_raw_json")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(activeTab === "raw" ? rawJsonString : extractedText)}
              leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs h-7 px-2.5"
            >
              {isCopied ? t("knowledge.copied_btn") : t("knowledge.copy_btn")}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs h-7 px-2.5"
            >
              {t("knowledge.download_btn")}
            </Button>
          </div>
        </div>

        {/* Tab View */}
        {activeTab === "structured" ? (
          <KbStructuredTextView
            isLoading={isLoading}
            extractedText={extractedText}
            structuredEntities={structuredEntities}
          />
        ) : (
          <KbRawJsonView
            isLoading={isLoading}
            rawJsonString={rawJsonString}
          />
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
