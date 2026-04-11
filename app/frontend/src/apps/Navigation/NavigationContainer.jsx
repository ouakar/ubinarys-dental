import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';

import { useAppContext } from '@/context/appContext';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { selectCompanySettings } from '@/redux/settings/selectors';
import { FILE_BASE_URL } from '@/config/serverApiConfig';

import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo.png';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  CalendarOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  MedicineBoxOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const { company_name, company_logo } = useSelector(selectCompanySettings) || {};
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const translate = useLanguage();
  const navigate = useNavigate();

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to={'/'}>{translate('dashboard')}</Link>,
    },
    {
      key: 'today',
      icon: <CalendarOutlined />,
      label: <Link to={'/today'}>{translate('Today')}</Link>,
    },
    {
      key: 'customer',
      icon: <UserOutlined />,
      label: <Link to={'/customer'}>{translate('patients')}</Link>,
    },
    {
      key: 'appointment',
      icon: <CalendarOutlined />,
      label: <Link to={'/appointment'}>{translate('Appointments')}</Link>,
    },

    {
      key: 'invoice',
      icon: <ContainerOutlined />,
      label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
    },
    {
      key: 'quote',
      icon: <FileSyncOutlined />,
      label: <Link to={'/quote'}>{translate('quote')}</Link>,
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      label: <Link to={'/payment'}>{translate('payments')}</Link>,
    },

    {
      key: 'paymentMode',
      label: <Link to={'/payment/mode'}>{translate('payments_mode')}</Link>,
      icon: <WalletOutlined />,
    },
    {
      key: 'taxes',
      label: <Link to={'/taxes'}>{translate('taxes')}</Link>,
      icon: <ShopOutlined />,
    },
    {
      key: 'treatment',
      label: <Link to={'/treatment'}>{translate('catalog_treatments')}</Link>,
      icon: <MedicineBoxOutlined />,
    },
    {
      key: 'daily-cash',
      label: <Link to={'/daily-cash'}>{translate('Daily Cash Report')}</Link>,
      icon: <PieChartOutlined />,
    },
    {
      key: 'monthly-overview',
      label: <Link to={'/monthly-overview'}>{translate('Monthly Overview')}</Link>,
      icon: <BarChartOutlined />,
    },
    {
      key: 'generalSettings',
      label: <Link to={'/settings'}>{translate('settings')}</Link>,
      icon: <SettingOutlined />,
    },
    {
      key: 'users',
      label: <Link to={'/settings/users'}>{translate('Utilisateurs') || 'Utilisateurs'}</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'about',
      label: <Link to={'/about'}>{translate('about')}</Link>,
      icon: <ReconciliationOutlined />,
    },
  ];

  const { role } = useSelector(selectCurrentAdmin);

  const filteredItems = items.filter((item) => {
    if (item.key === 'users' || item.key === 'generalSettings' || item.key === 'paymentMode' || item.key === 'taxes') {
      return role === 'admin' || role === 'owner';
    }
    return true;
  });

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else setCurrentPath(location.pathname.slice(1));
      }
  }, [location, currentPath]);

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }
    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);
  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',

        position: isMobile ? 'absolute' : 'relative',
        bottom: '20px',
        ...(!isMobile && {
          // border: 'none',
          ['left']: '20px',
          top: '20px',
          // borderRadius: '8px',
        }),
      }}
      theme={'light'}
    >
      <div
        className="logo"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <img 
          src={company_logo ? `${FILE_BASE_URL}${company_logo}?t=${Date.now()}` : logoIcon} 
          onError={(e) => { e.target.onerror = null; e.target.src = logoIcon; }}
          alt="Logo" 
          style={{ marginLeft: '-5px', height: '40px', maxWidth: '40px', objectFit: 'contain' }} 
        />

        {!showLogoApp && (
          <span
            style={{
              marginTop: '3px',
              fontSize: '22px',
              fontWeight: '700',
              color: '#1d39c4',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}
          >
            {company_name || 'Ubinarys'}
          </span>
        )}
      </div>
      <Menu
        items={filteredItems}
        mode="inline"
        theme={'light'}
        selectedKeys={[currentPath]}
        style={{
          width: 256,
        }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        style={{ ['marginLeft']: 25 }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        // style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
