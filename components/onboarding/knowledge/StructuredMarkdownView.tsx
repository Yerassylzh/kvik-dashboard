"use client";

import React from "react";
import { isTableStart, extractMarkdownTable, isInlinePipeRecord, parseInlinePipeRecords } from "@/lib/utils/markdown-table";
import { MarkdownTable, InlinePipeServiceCards } from "@/components/ui/MarkdownTable";

interface StructuredMarkdownViewProps {
  content: string;
}

function renderInlineFormatted(text: string): React.ReactNode[] {
  // Parse **bold text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function StructuredMarkdownView({
  content,
}: StructuredMarkdownViewProps) {
  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // Markdown Table Detection
    if (isTableStart(lines, i)) {
      const extracted = extractMarkdownTable(lines, i);
      if (extracted) {
        elements.push(
          <MarkdownTable key={`table-${i}`} data={extracted.tableData} />
        );
        i = extracted.nextIndex;
        continue;
      }
    }

    // Heading 1: # Title
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      const headerText = trimmed.replace(/^#\s+/, "");
      elements.push(
        <h2
          key={i}
          className="text-sm font-extrabold text-foreground tracking-tight pt-2 pb-0.5 border-b border-border/60 flex items-center gap-1.5"
        >
          <span>🏢</span>
          <span>{headerText}</span>
        </h2>
      );
      i++;
      continue;
    }

    // Heading 2: ## Title
    if (trimmed.startsWith("## ")) {
      const headerText = trimmed.replace(/^##\s+/, "");
      elements.push(
        <h3
          key={i}
          className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight pt-2 pb-0.5 border-b border-border/50 flex items-center gap-1.5"
        >
          <span>📌</span>
          <span>{headerText}</span>
        </h3>
      );
      i++;
      continue;
    }

    // Heading 3: ### Subtitle
    if (trimmed.startsWith("### ")) {
      const subText = trimmed.replace(/^###\s+/, "");
      elements.push(
        <h4
          key={i}
          className="text-xs font-bold text-foreground pt-1.5 pb-0.5 text-accent-brand"
        >
          {subText}
        </h4>
      );
      i++;
      continue;
    }

    // Heading 4: #### Subtitle
    if (trimmed.startsWith("#### ")) {
      const subText = trimmed.replace(/^####\s+/, "");
      elements.push(
        <h5
          key={i}
          className="text-xs font-semibold text-muted-foreground pt-1 pb-0.5"
        >
          {subText}
        </h5>
      );
      i++;
      continue;
    }

    // Bullet point: - item or * item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      elements.push(
        <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
          <span className="text-accent-brand font-bold text-sm leading-none mt-0.5">
            •
          </span>
          <span className="text-foreground">
            {renderInlineFormatted(itemText)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Inline pipe-delimited records (2GIS service format)
    if (isInlinePipeRecord(trimmed)) {
      const records = parseInlinePipeRecords(trimmed);
      if (records.length > 0) {
        elements.push(<InlinePipeServiceCards key={`pipe-${i}`} records={records} />);
        i++;
        continue;
      }
    }

    // Regular line
    elements.push(
      <p key={i} className="text-foreground">
        {renderInlineFormatted(trimmed)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-1 text-xs text-foreground font-sans leading-relaxed">
      {elements}
    </div>
  );
}
