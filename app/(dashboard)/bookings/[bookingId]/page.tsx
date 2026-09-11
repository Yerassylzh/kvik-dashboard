import type { Metadata } from "next";
import { BookingsPage } from "@/components/dashboard/bookings/BookingsPage";

export const metadata: Metadata = {
  title: "Запись — Kvik.ai",
};

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function Page({ params }: Props) {
  const { bookingId } = await params;
  return <BookingsPage initialBookingId={bookingId} />;
}
