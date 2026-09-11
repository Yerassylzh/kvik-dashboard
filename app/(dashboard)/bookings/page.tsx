import type { Metadata } from "next";
import { BookingsPage } from "@/components/dashboard/bookings/BookingsPage";

export const metadata: Metadata = {
  title: "Записи — Kvik.ai",
};

export default function Page() {
  return <BookingsPage />;
}
