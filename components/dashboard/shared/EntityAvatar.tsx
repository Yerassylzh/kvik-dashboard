"use client";

import React from "react";
import { Avatar } from "@/components/ui/avatar";
import type { AvatarSize } from "@/components/ui/avatar";

export interface EntityAvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

/** Thin semantic wrapper around Avatar for use with leads, staff, and contacts. */
export function EntityAvatar({ name, src, size = "sm", online, className }: EntityAvatarProps) {
  return <Avatar name={name} src={src} size={size} online={online} className={className} />;
}
