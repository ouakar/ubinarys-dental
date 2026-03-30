import {
  SettingOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FileImageOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import TabsContent from '@/components/TabsContent/TabsContent';

import CompanyLogoSettings from './CompanyLogoSettings';
import GeneralSettings from './GeneralSettings';
import CompanySettings from './CompanySettings';
import FinanceSettings from './FinanceSettings';
import MoneyFormatSettings from './MoneyFormatSettings';
import Users from '../Users';
import { UserOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';
import { useParams } from 'react-router-dom';

export default function Settings() {
  const translate = useLanguage();
  const { settingsKey } = useParams();
  const content = [
    {
      key: 'general_settings',
      label: translate('General Settings'),
      icon: <SettingOutlined />,
      children: <GeneralSettings />,
    },
    {
      key: 'company_settings',
      label: translate('Clinic Settings'),
      icon: <TrophyOutlined />,
      children: <CompanySettings />,
    },
    {
      key: 'company_logo',
      label: translate('Clinic Logo'),
      icon: <FileImageOutlined />,
      children: <CompanyLogoSettings />,
    },
    {
      key: 'finance_settings',
      label: translate('Finance Settings'),
      icon: <CreditCardOutlined />,
      children: <FinanceSettings />,
    },
    {
      key: 'users',
      label: 'Gestion du staff',
      icon: <UserOutlined />,
      children: <Users />,
    },
  ];

  const pageTitle = translate('Settings');

  return <TabsContent defaultActiveKey={settingsKey} content={content} pageTitle={pageTitle} />;
}
