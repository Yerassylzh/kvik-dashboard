"use client";

import React from "react";

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
  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-xs text-foreground font-sans leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 1: # Title
        if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
          const headerText = trimmed.replace(/^#\s+/, "");
          return (
            <h2
              key={idx}
              className="text-sm font-extrabold text-foreground tracking-tight pt-2 pb-0.5 border-b border-border/60 flex items-center gap-1.5"
            >
              <span>🏢</span>
              <span>{headerText}</span>
            </h2>
          );
        }

        // Heading 2: ## Title
        if (trimmed.startsWith("## ")) {
          const headerText = trimmed.replace(/^##\s+/, "");
          return (
            <h3
              key={idx}
              className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight pt-2 pb-0.5 border-b border-border/50 flex items-center gap-1.5"
            >
              <span>📌</span>
              <span>{headerText}</span>
            </h3>
          );
        }

        // Heading 3: ### Subtitle
        if (trimmed.startsWith("### ")) {
          const subText = trimmed.replace(/^###\s+/, "");
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-foreground pt-1.5 pb-0.5 text-accent-brand"
            >
              {subText}
            </h4>
          );
        }

        // Heading 4: #### Subtitle
        if (trimmed.startsWith("#### ")) {
          const subText = trimmed.replace(/^####\s+/, "");
          return (
            <h5
              key={idx}
              className="text-xs font-semibold text-muted-foreground pt-1 pb-0.5"
            >
              {subText}
            </h5>
          );
        }

        // Bullet point: - item or * item
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemText = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-accent-brand font-bold text-sm leading-none mt-0.5">
                •
              </span>
              <span className="text-foreground">
                {renderInlineFormatted(itemText)}
              </span>
            </div>
          );
        }

        // Regular line
        return (
          <p key={idx} className="text-foreground">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
