import { lazy, Suspense } from 'react';

import { isDevlog } from '@/game/routes';

const GamePage = lazy(() => import('@/pages/Game'));
const DevlogPage = lazy(() => import('@/pages/Devlog'));

function App() {
  const Page = isDevlog ? DevlogPage : GamePage;

  return (
    <Suspense fallback={<main role="status" aria-live="polite" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#4b513d', background: '#e9e3d2', fontFamily: 'system-ui, sans-serif' }}>Opening the neighborhood…</main>}>
      <Page />
    </Suspense>
  );
}

export default App;
