"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, AlertCircle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface KbDropzoneProps {
  isUploading: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".txt"];

export function KbDropzone({ isUploading, onUploadFiles }: KbDropzoneProps) {
  const t = useTranslations("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(t("knowledge.file_type_error"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`${file.name}: ${t("knowledge.file_size_limit_error")}`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      await onUploadFiles(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.txt"
        className="hidden"
        onChange={(e) => validateAndUpload(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
          isDragOver
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              {isUploading ? t("knowledge.uploading") : "Перетащите файлы сюда или нажмите для выбора"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Поддерживаются PDF, DOCX, XLSX, TXT (до 10 МБ)
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={isUploading}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs shrink-0 pointer-events-none"
        >
          Выбрать файлы
        </Button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
