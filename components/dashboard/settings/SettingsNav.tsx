"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Shuffle,
  User,
  Bell,
} from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useRBAC } from "@/hooks/useRBAC";

export interface SettingsNavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export const settingsNavItems: SettingsNavItem[] = [
  {
    href: "/settings/workspace",
    labelKey: "settings.nav_workspace",
    icon: Building2,
    roles: ["OWNER"],
  },
  {
    href: "/settings/staff",
    labelKey: "settings.nav_staff",
    icon: Shuffle,
    roles: ["OWNER", "ADMIN_MANAGER"],
  },
  {
    href: "/settings/account",
    labelKey: "settings.nav_account",
    icon: User,
    roles: ["OWNER", "ADMIN_MANAGER", "SPECIALIST"],
  },
  {
    href: "/settings/notifications",
    labelKey: "settings.nav_notifications",
    icon: Bell,
    roles: ["OWNER", "ADMIN_MANAGER"],
  },
];

export function SettingsNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { systemRole, isMounted } = useRBAC();

  const visibleItems = isMounted
    ? settingsNavItems.filter((item) => item.roles.includes(systemRole))
    : [];

  return (
    <div className="w-full border-b border-border/70 pb-0">
      <nav className="flex items-center gap-1 overflow-x-auto themed-scroll -mb-[1px]">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 select-none",
                isActive
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t(item.labelKey as any)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
