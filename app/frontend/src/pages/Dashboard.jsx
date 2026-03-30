import DashboardModule from '@/modules/DashboardModule';
import ReceptionDashboard from './Dashboard/ReceptionDashboard';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';

export default function Dashboard() {
  const currentAdmin = useSelector(selectCurrentAdmin);

  if (currentAdmin?.role !== 'owner' && currentAdmin?.role !== 'admin') {
    return <ReceptionDashboard />;
  }

  return <DashboardModule />;
}
