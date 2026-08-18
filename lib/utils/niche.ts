import { NicheProfile } from '@/types/niche';

export function getNicheLabel(niche: NicheProfile | null | undefined): string {
  const labels: Record<NicheProfile, string> = {
    REALTY: 'Недвижимость',
    AUTO_SALES: 'Автопродажи',
    AUTO_SERVICE: 'Автосервис',
    BEAUTY: 'Бьюти',
    CLINIC: 'Клиника',
    OTHER_CALENDAR: 'Запись на услуги',
  };
  return niche ? labels[niche] : 'Не выбрана';
}

export function getNicheIcon(niche: NicheProfile | null | undefined): string {
  const icons: Record<NicheProfile, string> = {
    REALTY: '🏠',
    AUTO_SALES: '🚗',
    AUTO_SERVICE: '🔧',
    BEAUTY: '💅',
    CLINIC: '🏥',
    OTHER_CALENDAR: '📅',
  };
  return niche ? icons[niche] : '❓';
}

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export function getNicheNavItems(niche: NicheProfile | null | undefined): NavItem[] {
  const base: NavItem[] = [
    { href: '/dashboard', label: 'Дашборд', icon: '📊' },
    { href: '/dashboard/inbox', label: 'Диалоги', icon: '💬' },
    { href: '/dashboard/leads', label: 'Лиды (CRM)', icon: '👥' },
  ];

  const nicheSpecific: Partial<Record<NicheProfile, NavItem[]>> = {
    REALTY: [{ href: '/dashboard/objects', label: 'Объекты Krisha', icon: '🏠' }],
    AUTO_SALES: [{ href: '/dashboard/catalog', label: 'Авто Kolesa', icon: '🚗' }],
    AUTO_SERVICE: [{ href: '/dashboard/schedule', label: 'Расписание', icon: '🔧' }],
    BEAUTY: [{ href: '/dashboard/schedule', label: 'Запись', icon: '💅' }],
    CLINIC: [{ href: '/dashboard/schedule', label: 'Расписание', icon: '🏥' }],
    OTHER_CALENDAR: [{ href: '/dashboard/schedule', label: 'Расписание', icon: '📅' }],
  };

  const tail: NavItem[] = [
    { href: '/dashboard/analytics', label: 'Аналитика', icon: '📈' },
    { href: '/dashboard/settings', label: 'Настройки', icon: '⚙️' },
    { href: '/dashboard/billing', label: 'Тариф и оплата', icon: '💳' },
  ];

  const specific = niche ? nicheSpecific[niche] ?? [] : [];
  return [...base, ...specific, ...tail];
}
