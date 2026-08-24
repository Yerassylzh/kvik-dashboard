'use client';

import React, { useState } from 'react';
import { KnowledgeEntryItem, RealtyListingData } from '@/types/niche';

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

export function operationLabel(op?: string): string {
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

function categoryLabel(v?: string): string {
  const raw = (v || '').trim();
  if (!raw) return '';
  const mapped = CATEGORY_LABELS[raw.toLowerCase()];
  if (mapped) return mapped;
  if (/[а-яё]/i.test(raw)) return prettifyCategory(raw);
  return '';
}

function ListingThumb({ src, alt, isAuto }: { src?: string; alt: string; isAuto?: boolean }) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-card border border-border flex items-center justify-center">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-muted-foreground text-lg">{isAuto ? '🚗' : '🏠'}</span>
      )}
    </div>
  );
}

function cleanDescription(raw?: string): string {
  if (!raw) return '';
  const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export function ListingCard({ item }: { item: KnowledgeEntryItem }) {
  const d: any = item.data || {};
  const isAuto = Boolean(
    item.type === 'car_listing' ||
    d.priceTenge !== undefined ||
    d.gallery?.images ||
    d.brand ||
    d.model ||
    d.year ||
    (item.sourceUrl && item.sourceUrl.includes('kolesa.kz'))
  );

  // 1. Gallery image extraction (Kolesa data.gallery.images array or fallbacks)
  const galleryImages = Array.isArray(d.gallery?.images) ? d.gallery.images : [];
  const imgSrc =
    galleryImages[0] ||
    d.mainPhoto ||
    (Array.isArray(d.photos) ? d.photos[0] : d.photos) ||
    (Array.isArray(d.images) ? d.images[0] : d.images) ||
    d.photo ||
    d.image;

  // 2. Title extraction & character limiting
  let rawTitle = isAuto
    ? d.title || d.name || [d.brand, d.model, d.year ? `${d.year} г.` : ''].filter(Boolean).join(' ')
    : d.fullAddress || d.title || d.name;

  if (!rawTitle) {
    rawTitle = `Объявление №${item.externalId || item.id}`;
  }

  const truncatedTitle =
    rawTitle.length > 60 ? `${rawTitle.slice(0, 60)}…` : rawTitle;

  // 3. Price resolution (handling priceTenge numeric field)
  const rawPrice = d.priceTenge ?? d.price ?? d.priceAmount;
  const priceDisplay =
    rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))
      ? `${Number(rawPrice).toLocaleString('ru-KZ')} ₸`
      : 'Цена по запросу';

  const op = operationLabel(d.operation || '');
  const paramsMap = d.params || {};
  const bodyType = paramsMap['Кузов'] || d.bodyType || d.category;
  const category = categoryLabel(bodyType);

  // Meta info chips
  const meta: string[] = [];
  if (isAuto) {
    const yearVal = d.year || (rawTitle.match(/(\d{4})\s*г/)?.[1]);
    if (yearVal) meta.push(`${yearVal} г.`);
    const mileageVal = paramsMap['Пробег'] || (d.mileage ? `${Number(d.mileage).toLocaleString('ru-KZ')} км` : null);
    if (mileageVal) meta.push(mileageVal);
    const engineVal = paramsMap['Объем двигателя, л'] || (d.engineVolume ? `${d.engineVolume} л` : null);
    if (engineVal) meta.push(engineVal);
    const transVal = paramsMap['Коробка передач'] || d.transmission;
    if (transVal) meta.push(transVal);
    const cityVal = paramsMap['Город'] || d.city;
    if (cityVal) meta.push(cityVal);
  } else {
    if (d.rooms) meta.push(`${d.rooms}-комн.`);
    if (d.square) meta.push(`${d.square} м²`);
    if (d.city) meta.push(d.city);
  }

  const sanitizedDesc = cleanDescription(d.description);

  const sourceName = item.sourceUrl?.includes('kolesa.kz')
    ? 'Открыть на Kolesa ↗'
    : item.sourceUrl?.includes('krisha.kz')
    ? 'Открыть на Krisha ↗'
    : 'Открыть источник ↗';

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors flex gap-3 sm:gap-4">
      <ListingThumb src={imgSrc} alt={truncatedTitle} isAuto={isAuto} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* For auto listings, 'Продажа' is redundant and hidden per user request */}
          {!isAuto && op && op !== 'Другое' && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
              {op}
            </span>
          )}
          {category && category.toLowerCase() !== op.toLowerCase() && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[10px]">
              {category}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <p className="font-bold text-slate-900 text-sm min-w-0 flex-1 truncate" title={rawTitle}>
            {truncatedTitle}
          </p>
          <span className="font-extrabold text-emerald-600 whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
            {priceDisplay}
          </span>
        </div>

        {meta.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {meta.map((m, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Cleaned HTML description limited to max ~120 chars */}
        {sanitizedDesc && (
          <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
            {sanitizedDesc}
          </p>
        )}

        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-brand hover:underline"
          >
            {sourceName}
          </a>
        )}
      </div>
    </div>
  );
}
