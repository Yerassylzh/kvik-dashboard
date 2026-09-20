"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { MarkdownTableData, InlinePipeRecord } from "@/lib/utils/markdown-table";

interface MarkdownTableProps {
  data: MarkdownTableData;
  className?: string;
}

/**
 * Parses bold text (**bold**) inside table cells.
 */
function renderCellContent(text: string): React.ReactNode {
  if (!text) return null;
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

/**
 * Renders a clean, modern SaaS data table from parsed markdown table data.
 */
export function MarkdownTable({ data, className }: MarkdownTableProps) {
  if (!data || !data.headers.length) return null;

  return (
    <div
      className={cn(
        "my-2.5 w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs",
        className
      )}
    >
      <div className="overflow-x-auto themed-scroll">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 border-b border-border/70">
            <tr>
              {data.headers.map((header, idx) => {
                const align = data.alignments?.[idx] || "left";
                return (
                  <th
                    key={idx}
                    className={cn(
                      "px-3 py-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider",
                      align === "center" && "text-center",
                      align === "right" && "text-right"
                    )}
                  >
                    {renderCellContent(header)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-muted/20 transition-colors duration-150"
              >
                {row.map((cell, cIdx) => {
                  const align = data.alignments?.[cIdx] || "left";
                  const isPriceOrNum =
                    /[\d\s]+(?:₸|KZT|тенге|руб|\$|€|%)/i.test(cell) ||
                    /^\s*[\d,.\s+-]+\s*$/.test(cell);

                  return (
                    <td
                      key={cIdx}
                      className={cn(
                        "px-3 py-2 text-foreground align-middle leading-relaxed",
                        isPriceOrNum && "tabular-nums font-medium",
                        align === "center" && "text-center",
                        align === "right" && "text-right"
                      )}
                    >
                      {renderCellContent(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlinePipeServiceCards — renders 2GIS pipe-delimited service records as cards
// ---------------------------------------------------------------------------

interface InlinePipeServiceCardsProps {
  records: InlinePipeRecord[];
  className?: string;
}

/**
 * Renders 2GIS-style inline pipe-delimited service records (Name | Description | Цена)
 * as a compact grid of service cards.
 */
export function InlinePipeServiceCards({ records, className }: InlinePipeServiceCardsProps) {
  if (!records.length) return null;

  return (
    <div
      className={cn(
        "my-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2",
        className
      )}
    >
      {records.map((record, idx) => {
        const hasPrice = !!record.price;
        return (
          <div
            key={idx}
            className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/20 transition-colors shadow-2xs"
          >
            {/* Service Name */}
            <span className="text-xs font-semibold text-foreground leading-snug">
              {record.name}
            </span>

            {/* Description */}
            {record.description && (
              <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {record.description}
              </span>
            )}

            {/* Price Badge */}
            {hasPrice && (
              <span className="mt-auto pt-1 self-start text-[11px] font-semibold tabular-nums text-primary bg-primary/8 px-2 py-0.5 rounded-md">
                {record.price}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

