import { NicheProfile } from '@/types/niche';

/**
 * Calendar-business niches only. Realty / Auto niches are deprecated —
 * see dev_docs/Product Architecture.md and dev_docs/backend/019_MOVING_NICHE_FOCUS_TO_CALENDAR.md.
 */
export function getNicheLabel(niche: NicheProfile | null | undefined): string {
  const labels: Record<NicheProfile, string> = {
    BEAUTY: 'Бьюти',
    CLINIC: 'Клиника',
    FITNESS: 'Фитнес',
    CONSULTING: 'Консалтинг',
    OTHER_CALENDAR: 'Запись на услуги',
  };
  return niche ? labels[niche] : 'Не выбрана';
}

export function getNicheIcon(niche: NicheProfile | null | undefined): string {
  const icons: Record<NicheProfile, string> = {
    BEAUTY: '💅',
    CLINIC: '🏥',
    FITNESS: '🏋️',
    CONSULTING: '💼',
    OTHER_CALENDAR: '📅',
  };
  return niche ? icons[niche] : '❓';
}

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export function getNicheNavItems(): NavItem[] {
  const base: NavItem[] = [
    { href: '/', label: 'Дашборд', icon: '📊' },
    { href: '/inbox', label: 'Диалоги', icon: '💬' },
    { href: '/leads', label: 'Лиды (CRM)', icon: '👥' },
    { href: '/schedule', label: 'Расписание', icon: '📅' },
  ];

  const tail: NavItem[] = [
    { href: '/analytics', label: 'Аналитика', icon: '📈' },
    { href: '/settings', label: 'Настройки', icon: '⚙️' },
    { href: '/billing', label: 'Тариф и оплата', icon: '💳' },
  ];

  return [...base, ...tail];
}
