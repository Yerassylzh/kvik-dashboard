"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { uploadKnowledgeDocument } from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface UploadedFileItem {
  name: string;
  size: number;
}

interface StageDocumentsProps {
  uploadedFiles: UploadedFileItem[];
  onAddUploadedFile: (file: UploadedFileItem) => void;
  onRemoveUploadedFile?: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

function formatBytes(size: number): string {
  if (!size) return "";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "📕";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "📊";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "📘";
  return "📄";
}

export function StageDocuments({
  uploadedFiles,
  onAddUploadedFile,
  onRemoveUploadedFile,
  onNext,
  onPrev,
}: StageDocumentsProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();

  // Local state for staged files (waiting to be uploaded upon user confirmation)
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToStage = (newFiles: FileList | File[]) => {
    const validFiles: File[] = [];

    Array.from(newFiles).forEach((file) => {
      const isAlreadyStaged = stagedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      const isAlreadyUploaded = uploadedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );

      if (!isAlreadyStaged && !isAlreadyUploaded) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validFiles]);
      toast.info(`Добавлено файлов в очередь: ${validFiles.length}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToStage(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToStage(e.dataTransfer.files);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessStagedFiles = async () => {
    if (stagedFiles.length === 0) return;

    try {
      setBusy(true);
      const total = stagedFiles.length;
      for (let i = 0; i < total; i++) {
        setUploadProgress({ current: i + 1, total });
        const file = stagedFiles[i];
        await uploadKnowledgeDocument(file);
        onAddUploadedFile({ name: file.name, size: file.size });
      }

      toast.success(
        total === 1
          ? `Файл «${stagedFiles[0].name}» успешно загружен и обработан!`
          : `Успешно загружено и обработано файлов: ${total}!`,
      );
      setStagedFiles([]);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("knowledge.documents.error_upload"),
      );
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const hasUploadedFiles = uploadedFiles.length > 0;
  const hasStagedFiles = stagedFiles.length > 0;

  return (
    <div className="space-y-5">
      {/* Short Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>📄</span>
          <span>{t("knowledge.documents.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.documents.desc")}
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !busy && fileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? "border-accent-brand bg-accent-brand/5 scale-[1.01]"
            : "border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40"
        } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.txt"
          onChange={handleFileChange}
          disabled={busy}
          className="hidden"
        />

        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
          {busy ? (
            <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            "📁"
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-foreground">
            {busy
              ? t("knowledge.documents.dropzone_busy")
              : t("knowledge.documents.dropzone_idle")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t("knowledge.documents.dropzone_formats")}
          </p>
        </div>
      </div>

      {/* Staged Files List (Waiting for batch processing) */}
      {hasStagedFiles && (
        <FadeIn className="space-y-2 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {t("knowledge.documents.staged_title", {
                count: stagedFiles.length,
              })}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-accent-brand font-semibold hover:underline cursor-pointer"
            >
              {t("knowledge.documents.add_more_prompt")}
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto themed-scroll">
            {stagedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{getFileIcon(file.name)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-xs">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemoveStagedFile(idx)}
                  title={t("knowledge.documents.remove_file")}
                  className="h-6 w-6 rounded-md hover:bg-destructive-subtle text-destructive-subtle-text font-bold text-xs flex items-center justify-center cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleProcessStagedFiles}
            disabled={busy}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {busy ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>
                  {uploadProgress
                    ? t("knowledge.documents.btn_processing_progress", {
                        current: uploadProgress.current,
                        total: uploadProgress.total,
                      })
                    : t("knowledge.documents.dropzone_busy")}
                </span>
              </>
            ) : (
              t("knowledge.documents.btn_process_all", {
                count: stagedFiles.length,
              })
            )}
          </button>
        </FadeIn>
      )}

      {/* Uploaded & Processed Files List */}
      {hasUploadedFiles && (
        <FadeIn delay={0.05} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-muted-foreground">
              {t("knowledge.documents.uploaded_title", {
                count: uploadedFiles.length,
              })}
            </label>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto themed-scroll">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{getFileIcon(file.name)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-xs">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    ✓ Обработано
                  </span>
                  {onRemoveUploadedFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveUploadedFile(idx)}
                      className="text-xs text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Stage Step Actions */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded-lg hover:bg-muted/60 transition-colors"
        >
          ← Назад к сайту
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{hasUploadedFiles ? "Далее (к заметкам) →" : "Пропустить (к заметкам) →"}</span>
        </button>
      </div>
    </div>
  );
}
