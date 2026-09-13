import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { ChangePasswordForm } from "@/components/dashboard/settings/account/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Аккаунт и безопасность — Kvik.ai",
};

export default function AccountSettingsPage() {
  return (
    <SettingsPageWrapper>
      <ChangePasswordForm />
    </SettingsPageWrapper>
  );
}
