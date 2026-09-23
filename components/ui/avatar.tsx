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

// Deterministic refined tone-on-tone palette inspired by Linear & Stripe
const colorVariants = [
  "bg-primary/10 text-primary border-primary/25",
  "bg-slate-100 text-slate-700 border-slate-200/90",
  "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  "bg-sky-50 text-sky-700 border-sky-200/80",
  "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  "bg-amber-50 text-amber-800 border-amber-200/80",
  "bg-violet-50 text-violet-700 border-violet-200/80",
];

function getColorVariant(name?: string): string {
  if (!name) return colorVariants[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colorVariants.length;
  return colorVariants[idx];
}

export function Avatar({ name, src, size = "md", online, className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = Boolean(src) && !imgError;

  return (
    <div className={clsx("relative flex-shrink-0 select-none", className)}>
      <div
        className={clsx(
          "rounded-full flex items-center justify-center font-semibold overflow-hidden border transition-colors",
          sizeClasses[size],
          showImage
            ? "border-border/60 bg-muted/40"
            : getColorVariant(name)
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name ?? "avatar"}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="tracking-tight uppercase">{getInitials(name)}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-card",
            onlineDotSizes[size],
            online ? "bg-emerald-500" : "bg-muted-foreground/60"
          )}
        />
      )}
    </div>
  );
}
