import { SettingsPageWrapper } from '@/components/dashboard/settings/SettingsPageWrapper';
import { NotificationSettingsPage } from '@/components/dashboard/settings/notifications/NotificationSettingsPage';

export default function NotificationSettingsRoute() {
  return (
    <SettingsPageWrapper>
      <NotificationSettingsPage />
    </SettingsPageWrapper>
  );
}
