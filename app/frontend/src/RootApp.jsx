import './style/app.css';
import './style/tailwind.css';

import { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '@/redux/store';
import PageLoader from '@/components/PageLoader';

const UbinarysOs = lazy(() => import('./apps/UbinarysOs'));

export default function RoutApp() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <Suspense fallback={<PageLoader />}>
          <UbinarysOs />
        </Suspense>
      </Provider>
    </BrowserRouter>
  );
}
