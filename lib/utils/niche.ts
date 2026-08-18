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
    { href: '/', label: 'Дашборд', icon: '📊' },
    { href: '/inbox', label: 'Диалоги', icon: '💬' },
    { href: '/leads', label: 'Лиды (CRM)', icon: '👥' },
  ];

  const nicheSpecific: Partial<Record<NicheProfile, NavItem[]>> = {
    REALTY: [{ href: '/objects', label: 'Объекты Krisha', icon: '🏠' }],
    AUTO_SALES: [{ href: '/catalog', label: 'Авто Kolesa', icon: '🚗' }],
    AUTO_SERVICE: [{ href: '/schedule', label: 'Расписание', icon: '🔧' }],
    BEAUTY: [{ href: '/schedule', label: 'Запись', icon: '💅' }],
    CLINIC: [{ href: '/schedule', label: 'Расписание', icon: '🏥' }],
    OTHER_CALENDAR: [{ href: '/schedule', label: 'Расписание', icon: '📅' }],
  };

  const tail: NavItem[] = [
    { href: '/analytics', label: 'Аналитика', icon: '📈' },
    { href: '/settings', label: 'Настройки', icon: '⚙️' },
    { href: '/billing', label: 'Тариф и оплата', icon: '💳' },
  ];

  const specific = niche ? nicheSpecific[niche] ?? [] : [];
  return [...base, ...specific, ...tail];
}

