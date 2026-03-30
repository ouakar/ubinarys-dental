import SetingsSection from '../components/SetingsSection';
import UpdateSettingModule from '../components/UpdateSettingModule';
import SettingsForm from './SettingsForm';
import useLanguage from '@/locale/useLanguage';

export default function CompanySettingsModule({ config }) {
  const translate = useLanguage();
  return (
    <UpdateSettingModule config={config}>
      <SetingsSection
        title={translate('Clinic Settings')}
        description={translate('Update your Clinic informations')}
      >
        <SettingsForm />
      </SetingsSection>
    </UpdateSettingModule>
  );
}
