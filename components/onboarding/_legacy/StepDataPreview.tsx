'use client';

import React, { useMemo, useState, useRef } from 'react';
import { ParsingStatus, KnowledgeEntryItem } from '@/types/niche';
import { ListingCard, operationLabel } from './preview/ListingCard';
import { CategoryTabFilter } from './preview/CategoryTabFilter';
import { ParsingProgressHeader } from './preview/ParsingProgressHeader';

export interface DataPreviewState {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
  entries: KnowledgeEntryItem[];
}

interface StepDataPreviewProps {
  dataPreview: DataPreviewState;
  nicheProfile?: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  onEditId: () => void;
  loading: boolean;
}

const ALL_TAB = '__ALL__';
const OPERATION_ORDER = ['Продажа', 'Аренда', 'Посуточно'];
const ITEMS_PER_PAGE = 5;

export function StepDataPreview({
  dataPreview,
  onConfirm,
  onRetry,
  onEditId,
  loading,
}: StepDataPreviewProps) {
  const { parsingStatus, parsedCount, totalCount, failedCount, error } = dataPreview;
  const entries = useMemo(() => dataPreview.entries || [], [dataPreview.entries]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sourceName = 'источника';

  const isParsing = parsingStatus === 'QUEUED' || parsingStatus === 'PROCESSING';
  const isFailed = parsingStatus === 'FAILED';
  const isEmpty = parsingStatus === 'DONE' && totalCount === 0 && entries.length === 0;

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of entries) {
      const label = operationLabel(it.data?.operation);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.keys())
      .sort((a, b) => {
        const ia = OPERATION_ORDER.indexOf(a);
        const ib = OPERATION_ORDER.indexOf(b);
        if (ia !== -1 || ib !== -1) {
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        }
        if (a === 'Другое') return 1;
        if (b === 'Другое') return -1;
        return a.localeCompare(b, 'ru');
      })
      .map((label) => ({ label, count: counts.get(label) || 0 }));
  }, [entries]);

  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const effectiveTab =
    activeTab !== ALL_TAB && tabs.some((t) => t.label === activeTab) ? activeTab : ALL_TAB;

  const visibleEntries = useMemo(
    () =>
      effectiveTab === ALL_TAB
        ? entries
        : entries.filter((it) => operationLabel(it.data?.operation) === effectiveTab),
    [entries, effectiveTab]
  );

  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return visibleEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleEntries, safePage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    handlePageChange(1);
  };

  if (isFailed) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-bold text-destructive text-sm">Не удалось загрузить объявления</p>
          <p className="text-destructive/80 text-xs mt-1.5">
            {error || `Произошла ошибка при обработке профиля ${sourceName}. Проверьте данные и попробуйте снова.`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditId}
            disabled={loading}
            className="flex-1 py-3 bg-secondary hover:bg-muted text-secondary-foreground font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            Изменить ID / Ссылку
          </button>
          <button
            onClick={onRetry}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Повтор...' : '↻ Загрузить снова'}
          </button>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-bold text-amber-300 text-sm">Активных объявлений не найдено</p>
          <p className="text-amber-300/80 text-xs mt-1.5">
            Профиль найден на {sourceName}, но активных объявлений у этого профиля нет. Проверьте, что указан
            верный ID, либо продолжите — базу знаний можно наполнить позже.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditId}
            disabled={loading}
            className="flex-1 py-3 bg-secondary hover:bg-muted text-secondary-foreground font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            ↻ Изменить ID
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Продолжаем...' : 'Продолжить без объектов →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ParsingProgressHeader
        parsingStatus={parsingStatus}
        parsedCount={parsedCount}
        totalCount={totalCount}
        failedCount={failedCount}
        sourceName={sourceName}
      />

      <CategoryTabFilter
        tabs={tabs}
        totalCount={entries.length}
        effectiveTab={effectiveTab}
        allTabKey={ALL_TAB}
        onSelectTab={handleSelectTab}
      />

      {/* Scrollable Container with max-h-[28rem] */}
      <div
        ref={scrollRef}
        className="themed-scroll space-y-3 max-h-[28rem] overflow-y-auto pr-1 -mr-1"
      >
        {paginatedEntries.length > 0 ? (
          <>
            {paginatedEntries.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}

            {/* Pagination Footer placed INSIDE the scroll container at the end of current page listings */}
            {totalPages > 1 && (
              <div className="pt-4 pb-2 px-2 flex items-center justify-center border-t border-border/60 text-xs">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-colors cursor-pointer"
                  >
                    ← Назад
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`h-8 w-8 rounded-lg font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${
                        pg === safePage
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Вперед →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-xs">
            {isParsing ? 'Загружаем первые объявления…' : 'Нет объявлений в этой категории'}
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        disabled={loading || isParsing || parsedCount === 0}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all disabled:bg-slate-200 disabled:text-slate-600 disabled:opacity-100 border border-transparent disabled:border-slate-300 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading
          ? 'Подтверждение...'
          : isParsing
          ? 'Дождитесь окончания загрузки...'
          : `Подтвердить ${parsedCount} объявлений и продолжить →`}
      </button>
    </div>
  );
}
