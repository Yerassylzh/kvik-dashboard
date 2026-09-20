/**
 * Utility functions to detect and parse Markdown tables into structured data.
 */

export interface MarkdownTableData {
  headers: string[];
  rows: string[][];
  alignments?: ("left" | "center" | "right")[];
}

/**
 * Parsed service record from a 2GIS-style inline pipe-delimited line.
 * E.g. "Name | Description | Цена: 180000 KZT"
 */
export interface InlinePipeRecord {
  name: string;
  description?: string;
  price?: string;
  extra?: string;
}

/**
 * Checks whether a given string is a markdown table delimiter row (e.g. "| --- | :---: | ---: |").
 */
export function isTableDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  return /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*(:?-{2,}:?\s*)?\|?\s*$/.test(trimmed);
}

/**
 * Splits a markdown table row into individual column cells.
 */
export function parseTableRow(line: string): string[] {
  let content = line.trim();
  if (content.startsWith("|")) content = content.slice(1);
  if (content.endsWith("|")) content = content.slice(0, -1);
  return content.split("|").map((cell) => cell.trim());
}

/**
 * Parses column alignments from a delimiter row.
 */
export function parseAlignments(delimiterLine: string): ("left" | "center" | "right")[] {
  const cols = parseTableRow(delimiterLine);
  return cols.map((col) => {
    const hasLeft = col.startsWith(":");
    const hasRight = col.endsWith(":");
    if (hasLeft && hasRight) return "center";
    if (hasRight) return "right";
    return "left";
  });
}

/**
 * Determines if line at `index` starts a valid markdown table.
 */
export function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length) return false;
  const currentLine = lines[index].trim();
  const nextLine = lines[index + 1].trim();

  if (!currentLine.includes("|") || !nextLine.includes("|")) return false;
  return isTableDelimiterRow(nextLine);
}

/**
 * Extracts full table data from a sequence of markdown lines starting at `startIndex`.
 */
export function extractMarkdownTable(
  lines: string[],
  startIndex: number
): { tableData: MarkdownTableData; nextIndex: number } | null {
  if (!isTableStart(lines, startIndex)) return null;

  const headers = parseTableRow(lines[startIndex]);
  const alignments = parseAlignments(lines[startIndex + 1]);
  const rows: string[][] = [];

  let i = startIndex + 2;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || !line.includes("|")) break;
    if (isTableDelimiterRow(line)) break;

    const rowCells = parseTableRow(line);
    while (rowCells.length < headers.length) {
      rowCells.push("");
    }
    rows.push(rowCells.slice(0, headers.length));
    i++;
  }

  return {
    tableData: { headers, rows, alignments },
    nextIndex: i,
  };
}

// ---------------------------------------------------------------------------
// Inline pipe-delimited records (2GIS scraper format)
// E.g.: "Name | Description | Цена: X KZT Name2 | Description2 | Цена: Y KZT"
// These are all on one line — NOT a markdown table.
// ---------------------------------------------------------------------------

const PRICE_RE = /Цена:\s*[\d\s.,]+(?:KZT|₸|тенге|руб|\$|€)/i;

/**
 * Returns true if the text looks like a 2GIS-style inline pipe-delimited record list.
 * Heuristic: contains ≥2 pipe chars and at least one price marker.
 */
export function isInlinePipeRecord(text: string): boolean {
  const pipeCount = (text.match(/\|/g) ?? []).length;
  return pipeCount >= 2 && PRICE_RE.test(text);
}

/**
 * Parses a 2GIS-style inline pipe-delimited string into an array of service records.
 *
 * Strategy: split on boundaries that look like the start of a new record.
 * A new record starts just BEFORE a token that is NOT a price and NOT a description
 * continuation — i.e. when we already have 3 pipe-segments and the next segment
 * doesn't start with "Цена:".
 *
 * Simpler approach: split on "|", then group into records of N fields (2–3).
 */
export function parseInlinePipeRecords(text: string): InlinePipeRecord[] {
  // Split the whole text by "|"
  const parts = text.split("|").map((p) => p.trim()).filter(Boolean);
  const records: InlinePipeRecord[] = [];

  let i = 0;
  while (i < parts.length) {
    const name = parts[i];
    if (!name) { i++; continue; }

    // Look ahead: if next part is a price → 2-field record
    // If next-next part is a price → 3-field record (name | desc | price)
    const nextIsPrice = parts[i + 1] ? PRICE_RE.test(parts[i + 1]) : false;
    const nextNextIsPrice = parts[i + 2] ? PRICE_RE.test(parts[i + 2]) : false;

    if (nextIsPrice) {
      // Format: name | Цена
      records.push({ name, price: parts[i + 1] });
      i += 2;
    } else if (nextNextIsPrice) {
      // Format: name | description | Цена
      records.push({ name, description: parts[i + 1], price: parts[i + 2] });
      i += 3;
    } else if (parts[i + 1] && !PRICE_RE.test(parts[i + 1])) {
      // Might be: name | description (no price found yet, take 2)
      records.push({ name, description: parts[i + 1] });
      i += 2;
    } else {
      // Standalone field — treat as name
      records.push({ name });
      i += 1;
    }
  }

  return records.filter((r) => r.name.length > 2);
}
