"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Hash, ListOrdered, CheckCircle, Sparkles } from "lucide-react";
import { isTableStart, extractMarkdownTable, MarkdownTableData, isInlinePipeRecord, parseInlinePipeRecords, InlinePipeRecord } from "@/lib/utils/markdown-table";
import { MarkdownTable, InlinePipeServiceCards } from "@/components/ui/MarkdownTable";

interface KbStructuredTextViewProps {
  isLoading: boolean;
  extractedText: string;
  structuredEntities: { label: string; value: string }[] | null;
}

interface ParsedBlock {
  type: "h2" | "h3" | "h4" | "bullet" | "numbered" | "paragraph" | "divider" | "table" | "pipe_records";
  content: string;
  number?: string;
  tableData?: MarkdownTableData;
  pipeRecords?: InlinePipeRecord[];
}

/**
 * Parses markdown-like structured text from 2GIS, website crawlers, and document extractors
 * into clean visual blocks (headings, lists, entity cards, paragraphs, tables).
 */
function parseStructuredBlocks(rawText: string): ParsedBlock[] {
  if (!rawText) return [];

  const lines = rawText.split("\n");
  const blocks: ParsedBlock[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(" ").trim();
      if (text) {
        blocks.push({ type: "paragraph", content: text });
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Markdown Table detection
    if (isTableStart(lines, i)) {
      flushParagraph();
      const extracted = extractMarkdownTable(lines, i);
      if (extracted) {
        blocks.push({
          type: "table",
          content: "",
          tableData: extracted.tableData,
        });
        i = extracted.nextIndex - 1;
        continue;
      }
    }

    // Dividers (--- or ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "divider", content: "" });
      continue;
    }

    // Heading 2: ## Title
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", content: trimmed.replace(/^##\s+/, "") });
      continue;
    }

    // Heading 3: ### Title
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "h3", content: trimmed.replace(/^###\s+/, "") });
      continue;
    }

    // Heading 4: #### Title
    if (trimmed.startsWith("#### ")) {
      flushParagraph();
      blocks.push({ type: "h4", content: trimmed.replace(/^####\s+/, "") });
      continue;
    }

    // Numbered list item: 1. Item or 1) Item
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      blocks.push({
        type: "numbered",
        number: numberedMatch[1],
        content: numberedMatch[2],
      });
      continue;
    }

    // Bullet list item: - Item, * Item, • Item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        type: "bullet",
        content: bulletMatch[1],
      });
      continue;
    }

    // Inline pipe-delimited records (2GIS service format: Name | Desc | Цена)
    if (isInlinePipeRecord(trimmed)) {
      flushParagraph();
      const pipeRecords = parseInlinePipeRecords(trimmed);
      if (pipeRecords.length > 0) {
        blocks.push({ type: "pipe_records", content: "", pipeRecords });
        continue;
      }
    }

    // Regular line -> accumulate into paragraph
    currentParagraphLines.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

/**
 * Render inline markdown (bold text **...** and price highlights)
 */
function renderInlineFormatted(text: string) {
  // Split on **bold** tags
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

export function KbStructuredTextView({
  isLoading,
  extractedText,
  structuredEntities,
}: KbStructuredTextViewProps) {
  const t = useTranslations("dashboard");

  const parsedBlocks = useMemo(() => {
    return parseStructuredBlocks(extractedText);
  }, [extractedText]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
        {t("knowledge.loading_data")}
      </div>
    );
  }

  if (!extractedText.trim()) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground italic rounded-2xl bg-muted/10 border border-dashed border-border/50">
        {t("knowledge.no_text_content")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key-Value Structured Metadata (if available) */}
      {structuredEntities && structuredEntities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {structuredEntities.map((ent, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-card border border-border/50 shadow-2xs text-xs"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                {ent.label}
              </span>
              <span className="font-bold text-foreground mt-0.5 block truncate">
                {ent.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Formatted Structured Content */}
      <div className="relative rounded-2xl bg-card border border-border/60 p-5 max-h-[380px] overflow-y-auto space-y-3.5 select-text shadow-xs">
        {parsedBlocks.map((block, index) => {
          switch (block.type) {
            case "table":
              return block.tableData ? (
                <MarkdownTable key={index} data={block.tableData} />
              ) : null;

            case "pipe_records":
              return block.pipeRecords ? (
                <InlinePipeServiceCards key={index} records={block.pipeRecords} />
              ) : null;

            case "h2":
              return (
                <div
                  key={index}
                  className="pt-2 pb-1 border-b border-border/40 flex items-center gap-2 first:pt-0"
                >
                  <div className="w-2 h-4 bg-primary rounded-full shrink-0" />
                  <h3 className="text-sm font-bold text-foreground">
                    {block.content}
                  </h3>
                </div>
              );

            case "h3":
              return (
                <div key={index} className="pt-2 pb-0.5 first:pt-0">
                  <h4 className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-primary font-mono font-bold">#</span>
                    {block.content}
                  </h4>
                </div>
              );

            case "h4":
              return (
                <div key={index} className="pt-1">
                  <h5 className="text-xs font-semibold text-muted-foreground">
                    {block.content}
                  </h5>
                </div>
              );

            case "numbered":
              return (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30 text-xs"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                    {block.number}
                  </span>
                  <div className="text-foreground leading-relaxed flex-1">
                    {renderInlineFormatted(block.content)}
                  </div>
                </div>
              );

            case "bullet":
              return (
                <div
                  key={index}
                  className="flex items-start gap-2.5 pl-2 text-xs text-foreground leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    {renderInlineFormatted(block.content)}
                  </div>
                </div>
              );

            case "divider":
              return <hr key={index} className="border-t border-border/40 my-2" />;

            case "paragraph":
            default:
              return (
                <p
                  key={index}
                  className="text-xs leading-relaxed text-foreground/90 font-sans"
                >
                  {renderInlineFormatted(block.content)}
                </p>
              );
          }
        })}
      </div>

      {/* Footer metadata info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>
          {t("knowledge.symbols_count")}: <strong className="text-foreground font-mono">{extractedText.length}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          {t("knowledge.used_for_rag")}
        </span>
      </div>
    </div>
  );
}
