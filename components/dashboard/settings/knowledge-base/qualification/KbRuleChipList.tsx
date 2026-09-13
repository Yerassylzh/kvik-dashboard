"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface KbRuleChipListProps {
  items: string[];
  placeholder: string;
  variant?: "destructive" | "warning";
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export function KbRuleChipList({
  items,
  placeholder,
  variant = "destructive",
  onAdd,
  onRemove,
}: KbRuleChipListProps) {
  const t = useTranslations("dashboard");
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAdd(inputValue.trim());
    setInputValue("");
  };

  const chipStyles =
    variant === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-amber-500/10 text-amber-600 border-amber-500/20";

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="text-xs h-8"
        />
        <Button type="submit" variant="outline" size="sm" className="text-xs shrink-0 h-8">
          <Plus className="w-3.5 h-3.5 mr-1" />
          {t("knowledge.qual_add_button")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${chipStyles}`}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="hover:opacity-70 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
