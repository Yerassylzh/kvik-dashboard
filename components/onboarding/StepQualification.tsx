"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { QualificationDto } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface StepQualificationProps {
  onSubmit: (data: QualificationDto) => void;
  onBack?: () => void;
  loading: boolean;
}

export function StepQualification({
  onSubmit,
  onBack,
  loading,
}: StepQualificationProps) {
  const t = useTranslations("onboarding");
  const [questions, setQuestions] = useState<string[]>(() => [
    t("qualification.default_q1"),
    t("qualification.default_q2"),
    t("qualification.default_q3"),
  ]);
  const [customInstructions, setCustomInstructions] = useState("");

  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const addQuestion = () => {
    if (questions.length >= 6) return;
    setQuestions((prev) => [...prev, ""]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: QualificationDto = {
      questions: questions.map((q) => q.trim()).filter(Boolean),
    };
    if (customInstructions.trim()) {
      dto.customInstructions = customInstructions.trim();
    }
    onSubmit(dto);
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FadeIn
        delay={0.05}
        className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground leading-relaxed"
      >
        {t("qualification.hint_text")}
      </FadeIn>

      <FadeIn delay={0.1} className="space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">
          {t("qualification.questions_label", { count: questions.length })}
        </label>
        {questions.map((question, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 text-accent-brand font-bold text-xs flex items-center justify-center flex-shrink-0">
              {index + 1}
            </span>
            <input
              type="text"
              value={question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              placeholder={t("qualification.question_placeholder")}
              className={inputClass}
            />
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                title={t("qualification.btn_add_question")}
                className="h-8 w-8 rounded-xl bg-destructive-subtle hover:bg-destructive/10 text-destructive font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {questions.length < 6 && (
          <button
            type="button"
            onClick={addQuestion}
            className="text-xs font-semibold text-accent-brand hover:underline cursor-pointer inline-flex items-center gap-1 pt-1"
          >
            {t("qualification.btn_add_question")}
          </button>
        )}
      </FadeIn>

      <FadeIn delay={0.15}>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          {t("qualification.custom_instructions_label")}
        </label>
        <textarea
          rows={3}
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={t("qualification.custom_instructions_placeholder")}
          className={inputClass}
        />
      </FadeIn>

      <FadeIn delay={0.2} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-3.5 px-5 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            ← Назад
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("qualification.btn_submitting")}
            </>
          ) : (
            t("qualification.btn_submit")
          )}
        </button>
      </FadeIn>
    </form>
  );
}
