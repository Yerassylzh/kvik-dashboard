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
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
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
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
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
