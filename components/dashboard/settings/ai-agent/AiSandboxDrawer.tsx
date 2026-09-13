"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, Clock, FileText, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiEngine } from "@/hooks/useAiEngine";

interface AiSandboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSandboxDrawer({ isOpen, onClose }: AiSandboxDrawerProps) {
  const t = useTranslations("dashboard");
  const { runTest, isTesting, testResult, testError, clearTest } = useAiEngine();
  const [inputMessage, setInputMessage] = useState("");
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTesting) return;

    await runTest(inputMessage.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="panel"
      title={t("settings.test_sandbox_title")}
      description={t("settings.test_sandbox_desc")}
    >
      <div className="flex flex-col h-[calc(100vh-200px)] space-y-4">
        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {/* Prompt Message */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Тестирование ИИ в реальном времени</span>
            </div>
            <p>
              Проверьте, как ИИ отвечает на вопросы о ценах, услугах и свободных слотах. Сообщения не отправляются реальным клиентам.
            </p>
          </div>

          {testResult && (
            <div className="space-y-3 pt-2">
              {/* Tool Execution Logs Accordion */}
              {testResult.toolCalls && testResult.toolCalls.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                    className="w-full flex items-center justify-between p-2.5 bg-muted/40 text-left font-semibold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-primary" />
                      <span>{t("ai.sim_tool_calls")}</span>
                      <Badge variant="primary" className="text-[10px] px-1.5 py-0.2">
                        {testResult.toolCallsCount || testResult.toolCalls.length}
                      </Badge>
                    </div>
                    {isToolsExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {isToolsExpanded && (
                    <div className="p-3 space-y-2.5 border-t border-border/40">
                      {testResult.toolCalls.map((call, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-card border border-border/40 space-y-1 font-mono text-[11px]">
                          <div className="font-bold text-primary flex items-center gap-1">
                            <span>▶ {call.name}()</span>
                          </div>
                          {call.args && (
                            <div className="text-muted-foreground text-[10px] pl-3">
                              <span className="font-semibold text-foreground">Args:</span> {JSON.stringify(call.args)}
                            </div>
                          )}
                          {call.result && (
                            <div className="text-emerald-600 text-[10px] pl-3">
                              <span className="font-semibold text-foreground">Result:</span> {JSON.stringify(call.result)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bot Response Bubble */}
              <div className="p-3.5 rounded-2xl bg-card border border-primary/40 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ответ ИИ</span>
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{testResult.latencyMs} мс</span>
                    </span>
                    {testResult.ragChunksUsed !== undefined && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{testResult.ragChunksUsed} чанков</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {testResult.response}
                </p>
              </div>
            </div>
          )}

          {testError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              {testError}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-2 border-t border-border/40">
          <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-2xl p-2 focus-within:border-primary">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t("settings.test_input_placeholder")}
              disabled={isTesting}
              className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isTesting}
              className="gap-1.5 h-8 px-3 rounded-xl text-xs"
            >
              <span>{isTesting ? "Обработка..." : "Тест"}</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
