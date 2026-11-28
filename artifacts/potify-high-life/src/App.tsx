import { lazy, Suspense } from 'react';

import { isDevlog } from '@/game/routes';

const GamePage = lazy(() => import('@/pages/Game'));
const DevlogPage = lazy(() => import('@/pages/Devlog'));

const ResidentReview = lazy(() => import('@/pages/ResidentReview'));

function App() {
  const Page = new URLSearchParams(location.search).has('resident') ? ResidentReview : isDevlog ? DevlogPage : GamePage;

  return (
    <Suspense fallback={<main role="status" aria-live="polite" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#4b513d', background: '#e9e3d2', fontFamily: 'system-ui, sans-serif' }}>Opening the neighborhood…</main>}>
      <Page />
    </Suspense>
  );
}

export default App;
