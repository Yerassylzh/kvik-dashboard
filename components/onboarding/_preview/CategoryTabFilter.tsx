'use client';

import React from 'react';

interface TabItem {
  label: string;
  count: number;
}

interface CategoryTabFilterProps {
  tabs: TabItem[];
  totalCount: number;
  effectiveTab: string;
  allTabKey: string;
  onSelectTab: (tabKey: string) => void;
}

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
          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm'
          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300')
      }
    >
      {label}
      <span
        className={
          'px-1.5 py-0.5 rounded-full text-[10px] font-bold ' +
          (active ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-200 text-slate-700')
        }
      >
        {count}
      </span>
    </button>
  );
}

export function CategoryTabFilter({
  tabs,
  totalCount,
  effectiveTab,
  allTabKey,
  onSelectTab,
}: CategoryTabFilterProps) {
  if (tabs.length < 2) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <TabButton
        label="Все"
        count={totalCount}
        active={effectiveTab === allTabKey}
        onClick={() => onSelectTab(allTabKey)}
      />
      {tabs.map((t) => (
        <TabButton
          key={t.label}
          label={t.label}
          count={t.count}
          active={effectiveTab === t.label}
          onClick={() => onSelectTab(t.label)}
        />
      ))}
    </div>
  );
}
