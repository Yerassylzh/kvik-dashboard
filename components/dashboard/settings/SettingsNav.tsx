"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MessageCircle, Users, Bot, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

const navItems = [
  { href: "/settings/workspace", labelKey: "settings.nav_workspace", icon: Building2 },
  { href: "/settings/channels", labelKey: "settings.nav_channels", icon: MessageCircle },
  { href: "/settings/staff", labelKey: "settings.nav_staff", icon: Users },
  { href: "/settings/ai-agent", labelKey: "settings.nav_ai", icon: Bot },
  { href: "/settings/billing", labelKey: "settings.nav_billing", icon: CreditCard },
];

export function SettingsNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 min-w-48">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card/60 hover:bg-card border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{t(item.labelKey as any)}</span>
          </Link>
        );
      })}
    </div>
  );
}
