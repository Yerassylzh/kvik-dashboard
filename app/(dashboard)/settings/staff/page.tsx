import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { StaffList } from "@/components/dashboard/settings/staff/StaffList";

export const metadata: Metadata = {
  title: "Специалисты и график — Kvik.ai",
};

export default function StaffSettingsPage() {
  return (
    <SettingsPageWrapper>
      <StaffList />
    </SettingsPageWrapper>
  );
}
