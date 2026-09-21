"use client";

import React, { useRef } from "react";
import { Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { MediaType } from "@/lib/api/conversations";

interface AttachmentPickerProps {
  onFileSelected: (file: File, mediaType: MediaType) => void;
  disabled?: boolean;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25MB

export function AttachmentPicker({ onFileSelected, disabled }: AttachmentPickerProps) {
  const t = useTranslations("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolveMediaType = (file: File): { mediaType: MediaType; maxBytes: number } | null => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/.test(name)) {
      return { mediaType: "IMAGE", maxBytes: MAX_IMAGE_BYTES };
    }
    if (type.startsWith("video/") || /\.(mp4|mov|quicktime)$/.test(name)) {
      return { mediaType: "VIDEO", maxBytes: MAX_VIDEO_BYTES };
    }
    if (type.startsWith("audio/") || /\.(ogg|oga|mp3|wav|m4a|aac|webm)$/.test(name)) {
      return { mediaType: "AUDIO", maxBytes: MAX_AUDIO_BYTES };
    }
    if (
      type.includes("pdf") ||
      type.includes("word") ||
      type.includes("excel") ||
      type.includes("spreadsheet") ||
      type.includes("document") ||
      type.includes("text") ||
      /\.(pdf|docx?|xlsx?|txt|csv)$/.test(name)
    ) {
      return { mediaType: "DOCUMENT", maxBytes: MAX_DOC_BYTES };
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be picked again
    e.target.value = "";

    const resolved = resolveMediaType(file);
    if (!resolved) {
      toast.error(t("inbox.attach_unsupported_format"));
      return;
    }

    if (file.size > resolved.maxBytes) {
      toast.error(t("inbox.attach_file_too_large"));
      return;
    }

    onFileSelected(file, resolved.mediaType);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors disabled:opacity-40 cursor-pointer"
        title={t("inbox.attach_file")}
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </div>
  );
}
