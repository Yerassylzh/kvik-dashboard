"use client";

import React, { useState } from "react";
import { Plus, X, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface StringListFieldProps {
  label: string;
  description?: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  badgeColor?: string;
  maxItems?: number;
}

export function StringListField({
  label,
  description,
  placeholder,
  items = [],
  onChange,
  badgeColor = "border-border/60 bg-muted/30 text-foreground",
  maxItems = 50,
}: StringListFieldProps) {
  const t = useTranslations("dashboard");
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChange([...items, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          {label}
        </label>
        <span className="text-[11px] text-muted-foreground font-mono">
          {items.length} / {maxItems}
        </span>
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="shrink-0 gap-1 text-xs h-9"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("settings.bc_add_item")}</span>
        </Button>
      </div>

      {/* Items rendering */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items.map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs shadow-2xs group transition-colors ${badgeColor}`}
            >
              <span className="leading-snug">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="opacity-60 hover:opacity-100 hover:text-destructive p-0.5 rounded transition-all cursor-pointer"
                title="Удалить"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-border/60 bg-muted/10 text-[11px] text-muted-foreground flex items-center gap-2">
          <ListPlus className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span>{t("settings.bc_empty_list")}</span>
        </div>
      )}
    </div>
  );
}
