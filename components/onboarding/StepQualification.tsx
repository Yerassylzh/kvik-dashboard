"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { QualificationDto } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StepQualificationProps {
  onSubmit: (data: QualificationDto) => void;
  loading: boolean;
}

export function StepQualification({
  onSubmit,
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
    const validQuestions = questions.map((q) => q.trim()).filter(Boolean);

    const dto: QualificationDto = {
      questions: validQuestions.map((q, idx) => ({
        id: `q${idx + 1}`,
        field: `question_${idx + 1}`,
        question: q,
        required: true,
      })),
    };
    if (customInstructions.trim()) {
      dto.disqualifiers = [customInstructions.trim()];
    }
    onSubmit(dto);
  };

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
            <div className="flex-1">
              <Input
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder={t("qualification.question_placeholder")}
              />
            </div>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                title={t("qualification.btn_add_question")}
                className="h-8 w-8 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
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
        <Textarea
          label={t("qualification.custom_instructions_label")}
          rows={3}
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={t("qualification.custom_instructions_placeholder")}
        />
      </FadeIn>

      <FadeIn delay={0.2} className="pt-2">
        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full shadow-md"
        >
          {loading
            ? t("qualification.btn_submitting")
            : t("qualification.btn_submit")}
        </Button>
      </FadeIn>
    </form>
  );
}
