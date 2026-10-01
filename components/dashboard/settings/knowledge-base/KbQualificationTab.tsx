"use client";

import React, { useState, useEffect } from "react";
import { Plus, CheckCircle2, Save, UserCheck, ShieldAlert, Sparkles, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KbQuestionItem } from "./qualification/KbQuestionItem";
import { KbRuleChipList } from "./qualification/KbRuleChipList";
import { knowledgeBaseApi, type QualificationRulesDto, type QualificationQuestion } from "@/lib/api/knowledgeBase";

interface KbQualificationTabProps {
  initialData?: QualificationRulesDto;
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbQualificationTab({
  initialData,
  onRefresh,
}: KbQualificationTabProps) {
  const t = useTranslations("dashboard");

  const [questions, setQuestions] = useState<QualificationQuestion[]>([]);
  const [disqualifiers, setDisqualifiers] = useState<string[]>([]);
  const [autoPassConditions, setAutoPassConditions] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const rules = initialData?.qualificationRules;
    if (rules) {
      const qVal = rules.questions || [];
      const dVal = rules.disqualifiers || [];
      const aVal = rules.autoPassConditions || [];
      const bMinVal = rules.budgetMin !== undefined ? String(rules.budgetMin) : "";
      const bMaxVal = rules.budgetMax !== undefined ? String(rules.budgetMax) : "";
      queueMicrotask(() => {
        setQuestions(qVal);
        setDisqualifiers(dVal);
        setAutoPassConditions(aVal);
        setBudgetMin(bMinVal);
        setBudgetMax(bMaxVal);
      });
    }
  }, [initialData]);

  const handleAddQuestion = () => {
    const newQ: QualificationQuestion = {
      id: `q_${Date.now()}`,
      field: `field_${questions.length + 1}`,
      question: "",
      required: true,
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, key: keyof QualificationQuestion, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [key]: value };
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await knowledgeBaseApi.updateQualification({
        questions: questions.filter((q) => q.question.trim().length > 0),
        disqualifiers,
        autoPassConditions,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefresh();
    } catch (err) {
      console.error("Failed to save qualification rules", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            {t("knowledge.qual_title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("knowledge.qual_description")}
          </p>
        </div>

        <Button
          type="button"
          variant={isSaved ? "outline" : "primary"}
          size="sm"
          onClick={handleSave}
          loading={isSaving}
          leftIcon={isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5" />}
          className="text-xs shrink-0"
        >
          {isSaved ? t("knowledge.qual_saved") : t("knowledge.qual_save")}
        </Button>
      </div>

      {/* Questions Section */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span>{t("knowledge.qual_questions")}</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            leftIcon={<Plus className="w-3 h-3" />}
            className="text-xs h-7"
          >
            {t("knowledge.qual_add_question")}
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-xs text-muted-foreground italic p-3 bg-muted/10 rounded-xl">
            {t("knowledge.qual_empty_questions")}
          </div>
        ) : (
          <div className="space-y-2.5">
            {questions.map((q, idx) => (
              <KbQuestionItem
                key={q.id || idx}
                question={q}
                index={idx}
                onUpdate={handleUpdateQuestion}
                onRemove={handleRemoveQuestion}
              />
            ))}
          </div>
        )}
      </div>

      {/* Disqualifiers Section */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
          <span>{t("knowledge.qual_disqualifiers")}</span>
        </label>
        <p className="text-[11px] text-muted-foreground">
          {t("knowledge.qual_disqualifiers_hint")}
        </p>

        <KbRuleChipList
          items={disqualifiers}
          placeholder={t("knowledge.qual_disqualifier_placeholder")}
          variant="destructive"
          onAdd={(item) => setDisqualifiers([...disqualifiers, item])}
          onRemove={(idx) => setDisqualifiers(disqualifiers.filter((_, i) => i !== idx))}
        />
      </div>

      {/* Auto-Pass Conditions */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t("knowledge.qual_autopass")}</span>
        </label>
        <p className="text-[11px] text-muted-foreground">
          {t("knowledge.qual_autopass_hint")}
        </p>

        <KbRuleChipList
          items={autoPassConditions}
          placeholder={t("knowledge.qual_autopass_placeholder")}
          variant="warning"
          onAdd={(item) => setAutoPassConditions([...autoPassConditions, item])}
          onRemove={(idx) => setAutoPassConditions(autoPassConditions.filter((_, i) => i !== idx))}
        />
      </div>

      {/* Budget Range */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          <span>{t("knowledge.qual_budget_section")}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t("knowledge.qual_budget_min")}</label>
            <Input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="0"
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t("knowledge.qual_budget_max")}</label>
            <Input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder={t("knowledge.qual_budget_unlimited")}
              className="text-xs h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
