import React from 'react';
import { ChannelDto } from '@/types/niche';

interface StepConnectChannelProps {
  onConnect: (type: ChannelDto['type']) => void;
  loading: boolean;
}

export function StepConnectChannel({ onConnect, loading }: StepConnectChannelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">💬</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                РЕКОМЕНДУЕТСЯ
              </span>
            </div>
            <h4 className="font-bold text-foreground text-sm">WhatsApp Business</h4>
            <p className="text-muted-foreground text-xs mt-1">Автоответы в WhatsApp 24/7 по вашей базе знаний</p>
          </div>
          <button
            onClick={() => onConnect('WHATSAPP')}
            disabled={loading}
            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-colors disabled:opacity-50"
          >
            Подключить QR-код
          </button>
        </div>

        {/* Instagram */}
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📸</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary-foreground text-[10px] font-bold border border-primary/20">
                DIRECT
              </span>
            </div>
            <h4 className="font-bold text-foreground text-sm">Instagram Direct</h4>
            <p className="text-muted-foreground text-xs mt-1">Авто-ответы на сообщения в директ и комментарии к постам</p>
          </div>
          <button
            onClick={() => onConnect('INSTAGRAM')}
            disabled={loading}
            className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary-foreground font-semibold text-xs rounded-xl border border-primary/30 transition-colors disabled:opacity-50"
          >
            Войти через Meta
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-muted-foreground">
          Нужно подключить хотя бы один канал, чтобы ИИ мог принимать сообщения. Дополнительные
          каналы можно добавить позже в настройках.
        </p>
      </div>
    </div>
  );
}
