"use client";

import React from "react";
import clsx from "clsx";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const onlineDotSizes: Record<AvatarSize, string> = {
  xs: "h-1.5 w-1.5 ring-1",
  sm: "h-2 w-2 ring-[1.5px]",
  md: "h-2.5 w-2.5 ring-2",
  lg: "h-3 w-3 ring-2",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic gradient from name — ensures consistent color per person
function getGradient(name?: string): string {
  const gradients = [
    "from-indigo-500 to-cyan-400",
    "from-violet-500 to-pink-400",
    "from-emerald-500 to-teal-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
    "from-sky-500 to-blue-400",
  ];
  if (!name) return gradients[0];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

export function Avatar({ name, src, size = "md", online, className }: AvatarProps) {
  return (
    <div className={clsx("relative flex-shrink-0", className)}>
      <div
        className={clsx(
          "rounded-full flex items-center justify-center font-bold text-white select-none overflow-hidden",
          sizeClasses[size],
          !src && `bg-gradient-to-tr ${getGradient(name)}`
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name ?? "avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-full ring-card",
            onlineDotSizes[size],
            online ? "bg-emerald-500" : "bg-muted-foreground"
          )}
        />
      )}
    </div>
  );
}
