'use client';

import React, { useMemo, useState } from 'react';
import { ParsingStatus, KnowledgeEntryItem, RealtyListingData } from '@/types/niche';

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
  onConfirm: () => void;
  onRetry: () => void;
  onEditId: () => void;
  loading: boolean;
}

const ALL_TAB = '__ALL__';

// Известные операции Krisha → человекочитаемая подпись.
// Всё, чего нет в карте, показываем как есть (с большой буквы).
const OPERATION_LABELS: Record<string, string> = {
  prodazha: 'Продажа',
  prodam: 'Продажа',
  sale: 'Продажа',
  sell: 'Продажа',
  arenda: 'Аренда',
  sdam: 'Аренда',
  rent: 'Аренда',
  'arenda-posutochno': 'Посуточно',
  posutochno: 'Посуточно',
  daily: 'Посуточно',
};

// Порядок вкладок: частые операции — вперёд, «Другое» — в конец.
const OPERATION_ORDER = ['Продажа', 'Аренда', 'Посуточно'];

function operationLabel(op?: string): string {
  const raw = (op || '').trim();
  if (!raw) return 'Другое';
  const mapped = OPERATION_LABELS[raw.toLowerCase()];
  if (mapped) return mapped;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function prettifyCategory(v?: string): string {
  const raw = (v || '').trim();
  if (!raw) return '';
  const spaced = raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Слоги категорий/разделов Krisha (латиницей) → человекочитаемая русская подпись.
const CATEGORY_LABELS: Record<string, string> = {
  kvartiry: 'Квартира',
  'prodazha-kvartiry': 'Квартира',
  'arenda-kvartiry': 'Квартира',
  komnaty: 'Комната',
  doma: 'Дом',
  'prodazha-doma': 'Дом',
  'arenda-doma': 'Дом',
  dachi: 'Дача',
  uchastki: 'Участок',
  uchastok: 'Участок',
  prombazy: 'Промбаза',
  'kommercheskaya-nedvizhimost': 'Коммерция',
  ofisy: 'Офис',
  magaziny: 'Магазин',
  sklady: 'Склад',
  pomeshcheniya: 'Помещение',
  zdaniya: 'Здание',
  garazhi: 'Гараж',
  'vozmu-v-arendu': 'Сниму',
  kuplyu: 'Куплю',
};

// Русская подпись категории. Неизвестный латинский слог не показываем вовсе —
// пользователю (риелтору) не выводим сырую латиницу вроде «Vozmu v arendu».
function categoryLabel(v?: string): string {
  const raw = (v || '').trim();
  if (!raw) return '';
  const mapped = CATEGORY_LABELS[raw.toLowerCase()];
  if (mapped) return mapped;
  // Уже по-русски (есть кириллица) — просто причёсываем.
  if (/[а-яё]/i.test(raw)) return prettifyCategory(raw);
  // Латинский слог, которого нет в карте — скрываем чип.
  return '';
}

// --- Вкладка-фильтр по операции ---
function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ' +
        (active
          ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700')
      }
    >
      {label}
      <span
        className={
          'px-1.5 py-0.5 rounded-full text-[10px] font-bold ' +
          (active ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-800 text-slate-400')
        }
      >
        {count}
      </span>
    </button>
  );
}

// --- Превью-фото объекта (best-effort, с фолбэком) ---
function ListingThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800/70 border border-slate-700/60 flex items-center justify-center">
      {show ? (
        // Внешние картинки Krisha — обычный <img> без next/image (домены не сконфигурированы).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-slate-500 text-lg">🏠</span>
      )}
    </div>
  );
}

// --- Карточка одного объекта ---
function ListingCard({ item }: { item: KnowledgeEntryItem }) {
  const d: RealtyListingData = item.data || {};
  const title = d.fullAddress || `ID: ${item.externalId || item.id}`;
  const op = operationLabel(d.operation);
  const category = categoryLabel(d.category);

  const meta: string[] = [];
  if (d.rooms) meta.push(`${d.rooms}-комн.`);
  if (d.square) meta.push(`${d.square} м²`);
  if (d.city) meta.push(d.city);

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex gap-3 sm:gap-4">
      <ListingThumb src={d.mainPhoto} alt={title} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold text-[10px]">
            {op}
          </span>
          {category && category.toLowerCase() !== op.toLowerCase() && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium text-[10px]">
              {category}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <p className="font-bold text-white text-sm min-w-0 flex-1 truncate">{title}</p>
          <span className="font-extrabold text-emerald-400 whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
            {d.price ? `${d.price.toLocaleString('ru-KZ')} ₸` : 'Цена по запросу'}
          </span>
        </div>

        {meta.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {meta.map((m, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded-md bg-slate-800/70 text-slate-300 text-[10px] font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
          {d.description || 'Описание не указано'}
        </p>

        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Открыть на Krisha ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function StepDataPreview({ dataPreview, onConfirm, onRetry, onEditId, loading }: StepDataPreviewProps) {
  const { parsingStatus, parsedCount, totalCount, failedCount, error } = dataPreview;
  // Стабильная ссылка: без useMemo `|| []` создаёт новый массив каждый рендер
  // и обнуляет мемоизацию tabs/visibleEntries ниже.
  const entries = useMemo(() => dataPreview.entries || [], [dataPreview.entries]);

  const isParsing = parsingStatus === 'QUEUED' || parsingStatus === 'PROCESSING';
  const isFailed = parsingStatus === 'FAILED';
  const isEmpty = parsingStatus === 'DONE' && totalCount === 0 && entries.length === 0;

  const progressPercent =
    totalCount > 0 ? Math.min(100, Math.round((parsedCount / totalCount) * 100)) : 0;

  // Вкладки по операции (Продажа / Аренда / …): собираем из того, что реально пришло.
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

  // Показываем вкладки только когда есть что фильтровать (>= 2 операций).
  const showTabs = tabs.length >= 2;
  // Если активная вкладка «исчезла» (данные обновились поллингом) — падаем на «Все».
  const effectiveTab =
    activeTab !== ALL_TAB && tabs.some((t) => t.label === activeTab) ? activeTab : ALL_TAB;

  const visibleEntries = useMemo(
    () =>
      effectiveTab === ALL_TAB
        ? entries
        : entries.filter((it) => operationLabel(it.data?.operation) === effectiveTab),
    [entries, effectiveTab]
  );

  // --- FAILED: ошибка загрузки + повтор ---
  if (isFailed) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-bold text-rose-300 text-sm">Не удалось загрузить объявления</p>
          <p className="text-rose-300/80 text-xs mt-1.5">
            {error || 'Произошла ошибка при обработке профиля Krisha.kz. Проверьте ID и попробуйте снова.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditId}
            disabled={loading}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            Изменить ID
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

  // --- DONE, но 0 объявлений: валидный ID, но пусто ---
  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-bold text-amber-300 text-sm">Активных объявлений не найдено</p>
          <p className="text-amber-300/80 text-xs mt-1.5">
            ID найден на Krisha.kz, но активных объявлений у этого профиля нет. Проверьте, что указан
            верный ID, либо продолжите — базу знаний можно наполнить позже.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditId}
            disabled={loading}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
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

  // --- QUEUED / PROCESSING / DONE (с объектами) ---
  return (
    <div className="space-y-5">
      {/* Статус загрузки (числа приходят с бэкенда — не трогаем) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isParsing ? (
              <div className="h-5 w-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />
            ) : (
              <span className="text-emerald-400 font-bold text-base flex-shrink-0">✓</span>
            )}
            <div className="min-w-0">
              <p className="font-bold text-white">
                {parsingStatus === 'QUEUED'
                  ? 'Готовимся к загрузке...'
                  : isParsing
                  ? 'Загружаем ваши объявления с Krisha.kz...'
                  : 'Загрузка завершена!'}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Загружено {parsedCount}
                {totalCount > 0 ? ` из ${totalCount}` : ''} объявлений
                {failedCount > 0 ? ` · ${failedCount} с ошибкой` : ''}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-[10px] whitespace-nowrap flex-shrink-0">
            {isParsing ? 'Загрузка…' : 'Готово'}
          </span>
        </div>

        {/* Progress bar (пока идёт загрузка и известно сколько всего) */}
        {isParsing && totalCount > 0 && (
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Вкладки по операции: клик фильтрует список */}
      {showTabs && (
        <div className="flex flex-wrap gap-2">
          <TabButton
            label="Все"
            count={entries.length}
            active={effectiveTab === ALL_TAB}
            onClick={() => setActiveTab(ALL_TAB)}
          />
          {tabs.map((t) => (
            <TabButton
              key={t.label}
              label={t.label}
              count={t.count}
              active={effectiveTab === t.label}
              onClick={() => setActiveTab(t.label)}
            />
          ))}
        </div>
      )}

      {/* Список объектов — просторные карточки, комфортный скролл */}
      <div className="themed-scroll space-y-3 max-h-[28rem] overflow-y-auto pr-1 -mr-1">
        {visibleEntries.length > 0 ? (
          visibleEntries.map((item) => <ListingCard key={item.id} item={item} />)
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            {isParsing ? 'Загружаем первые объявления…' : 'Нет объявлений в этой категории'}
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        disabled={loading || isParsing || parsedCount === 0}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
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
