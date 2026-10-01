import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookingsPage } from "@/components/dashboard/bookings/BookingsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.bookings")} — Kvik.ai`,
  };
}

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function Page({ params }: Props) {
  const { bookingId } = await params;
  return <BookingsPage initialBookingId={bookingId} />;
}
