"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import type { ManualNoteDto } from "@/types/knowledgeBase";

interface KbNoteEditModalProps {
  isOpen: boolean;
  note: ManualNoteDto | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (id: string, payload: { title?: string; note: string }) => Promise<void>;
}

export function KbNoteEditModal({
  isOpen,
  note,
  isSaving,
  onClose,
  onSave,
}: KbNoteEditModalProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.note || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [note, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !content.trim()) return;
    await onSave(note.id, {
      title: title.trim() || undefined,
      note: content.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("knowledge.edit_note")}
      width="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("knowledge.note_title_placeholder")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("knowledge.note_title_placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("knowledge.note_content_placeholder")}
          </label>
          <Textarea
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("knowledge.note_content_placeholder")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
            disabled={!content.trim()}
          >
            {tCommon("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
