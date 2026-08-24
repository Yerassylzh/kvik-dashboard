'use client';

import React from 'react';
import { ParsingStatus } from '@/types/niche';

interface ParsingProgressHeaderProps {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  sourceName?: string;
}

export function ParsingProgressHeader({
  parsingStatus,
  parsedCount,
  totalCount,
  failedCount,
  sourceName = 'источника',
}: ParsingProgressHeaderProps) {
  const isParsing = parsingStatus === 'QUEUED' || parsingStatus === 'PROCESSING';
  const progressPercent =
    totalCount > 0 ? Math.min(100, Math.round((parsedCount / totalCount) * 100)) : 0;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isParsing ? (
            <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin flex-shrink-0" />
          ) : (
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">✓</span>
          )}
          <div className="min-w-0">
            <p className="font-bold text-foreground">
              {parsingStatus === 'QUEUED'
                ? 'Готовимся к загрузке...'
                : isParsing
                ? `Загружаем ваши объявления с ${sourceName}...`
                : 'Загрузка завершена!'}
            </p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Загружено {parsedCount}
              {totalCount > 0 ? ` из ${totalCount}` : ''} объявлений
              {failedCount > 0 ? ` · ${failedCount} с ошибкой` : ''}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] whitespace-nowrap flex-shrink-0">
          {isParsing ? 'Загрузка…' : 'Готово'}
        </span>
      </div>

      {isParsing && totalCount > 0 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
