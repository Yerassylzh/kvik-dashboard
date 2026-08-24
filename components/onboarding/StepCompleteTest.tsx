import React, { useState } from 'react';

interface StepCompleteTestProps {
  onComplete: () => void;
  loading: boolean;
}

export function StepCompleteTest({ onComplete, loading }: StepCompleteTestProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([
    { role: 'bot', text: 'Здравствуйте! Я ИИ-ассистент вашего агентства. Чем могу помочь по объектам?' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `Отлично! Я нашел информацию в вашей базе знаний по запросу: "${userMsg}". ИИ-агент полностью готов!`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Mini Chat simulator */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted border border-border text-foreground rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишите тестовое сообщение ИИ-ассистенту..."
          className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-secondary hover:bg-muted text-secondary-foreground font-semibold text-xs rounded-xl transition-colors"
        >
          Отправить
        </button>
      </form>

      <button
        onClick={onComplete}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
      >
        {loading ? 'Активация...' : '🚀 Завершить онбординг и перейти в дашборд'}
      </button>
    </div>
  );
}
