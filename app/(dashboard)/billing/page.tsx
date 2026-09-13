import type { Metadata } from "next";
import { BillingPage } from "@/components/dashboard/billing/BillingPage";

export const metadata: Metadata = {
  title: "Тариф и оплата — Kvik.ai",
};

export default function BillingRoutePage() {
  return <BillingPage />;
}
