import { lazy, Suspense } from 'react';

const GamePage = lazy(() => import('@/pages/Game'));
const DevlogPage = lazy(() => import('@/pages/Devlog'));

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname.replace(/\/+$/, '');
  const Page = currentPath === `${basePath}/devlog` ? DevlogPage : GamePage;

  return (
    <Suspense fallback={<main role="status" aria-live="polite" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#4b513d', background: '#e9e3d2', fontFamily: 'system-ui, sans-serif' }}>Opening the neighborhood…</main>}>
      <Page />
    </Suspense>
  );
}

export default App;
