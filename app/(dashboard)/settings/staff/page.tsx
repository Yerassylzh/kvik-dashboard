import { SettingsPageWrapper } from '@/components/dashboard/settings/SettingsPageWrapper';
import { StaffSettingsPage } from '@/components/dashboard/settings/staff/StaffSettingsPage';

export default function StaffSettingsRoute() {
  return (
    <SettingsPageWrapper>
      <StaffSettingsPage />
    </SettingsPageWrapper>
  );
}
