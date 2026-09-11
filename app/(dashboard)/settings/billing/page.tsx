import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { BillingOverview } from "@/components/dashboard/settings/billing/BillingOverview";

export const metadata: Metadata = {
  title: "Тариф и токены — Kvik.ai",
};

export default function BillingSettingsPage() {
  return (
    <SettingsPageWrapper>
      <BillingOverview />
    </SettingsPageWrapper>
  );
}
