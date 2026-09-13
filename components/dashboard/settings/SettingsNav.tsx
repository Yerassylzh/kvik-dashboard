"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  MessageCircle,
  Users,
  Bot,
  Database,
  Sparkles,
  SlidersHorizontal,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useRBAC } from "@/hooks/useRBAC";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles: string[];
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupKey: "settings.group_business",
    items: [
      { href: "/settings/workspace", labelKey: "settings.nav_workspace", icon: Building2, roles: ["OWNER"] },
      { href: "/settings/staff", labelKey: "settings.nav_staff", icon: Users, roles: ["OWNER", "ADMIN_MANAGER"] },
    ],
  },
  {
    groupKey: "settings.group_integrations",
    items: [
      { href: "/settings/channels", labelKey: "settings.nav_channels", icon: MessageCircle, roles: ["OWNER", "ADMIN_MANAGER"] },
    ],
  },
  {
    groupKey: "settings.group_security",
    items: [
      { href: "/settings/account", labelKey: "settings.nav_account", icon: Shield, roles: ["OWNER", "ADMIN_MANAGER", "SPECIALIST"] },
      { href: "/settings/advanced", labelKey: "settings.nav_advanced", icon: SlidersHorizontal, roles: ["OWNER", "ADMIN_MANAGER"] },
    ],
  },
];

export function SettingsNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { systemRole } = useRBAC();

  return (
    <div className="w-full border-b border-border/60 pb-2">
      <nav className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(systemRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupKey} className="flex items-center gap-1.5 shrink-0">
              {gIdx > 0 && (
                <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block shrink-0" />
              )}
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                        : "bg-card/40 hover:bg-card border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{t(item.labelKey as any)}</span>

                    {item.badge && (
                      <span
                        className={clsx(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ml-0.5",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
