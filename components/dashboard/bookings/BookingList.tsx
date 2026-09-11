"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BookingCard } from "./BookingCard";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion/StaggerContainer";
import type { BookingDto } from "@/lib/api/bookings";

interface BookingListProps {
  bookings: BookingDto[];
  onSelectBooking: (booking: BookingDto) => void;
  isLoading?: boolean;
}

export function BookingList({
  bookings,
  onSelectBooking,
  isLoading,
}: BookingListProps) {
  const t = useTranslations("dashboard");

  if (bookings.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl text-muted-foreground text-sm">
        {t("common.empty_data")}
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookings.map((booking) => (
        <StaggerItem key={booking.id}>
          <BookingCard booking={booking} onSelect={onSelectBooking} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
