import React, { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider, useMe } from './app/session';
import { Shell } from './app/Shell';
import { ToastProvider } from './ui';
import { Landing } from './pages/Landing';
import { Today } from './pages/Today';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="font-headline text-3xl font-black">Something went wrong</h1>
        <p className="muted mt-2 max-w-md">{this.state.error.message}</p>
        <button className="brut-sm mt-6 rounded-full bg-primary px-6 py-3 font-headline font-extrabold text-on-primary" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}

const pages = {
  Academics: lazy(() => import('./pages/Academics')),
  Teaching: lazy(() => import('./pages/Teaching')),
  Campus: lazy(() => import('./pages/Campus')),
  Events: lazy(() => import('./pages/Events')),
  Clubs: lazy(() => import('./pages/Clubs')),
  Directory: lazy(() => import('./pages/Directory')),
  Inbox: lazy(() => import('./pages/Inbox')),
  Me: lazy(() => import('./pages/Me')),
  Manage: lazy(() => import('./pages/Manage')),
  Info: lazy(() => import('./pages/Info')),
};

const Gate: React.FC = () => { const me = useMe(); return me ? <Shell /> : <Landing />; };

export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          <HashRouter>
            <Suspense fallback={<div className="p-10 text-center font-headline font-bold">Loading…</div>}>
              <Routes>
                <Route element={<Gate />}>
                  <Route index element={<Today />} />
                  <Route path="academics/*" element={<pages.Academics />} />
                  <Route path="teaching/*" element={<pages.Teaching />} />
                  <Route path="campus" element={<pages.Campus />} />
                  <Route path="events/*" element={<pages.Events />} />
                  <Route path="clubs/*" element={<pages.Clubs />} />
                  <Route path="departments/*" element={<pages.Directory />} />
                  <Route path="people/*" element={<pages.Directory />} />
                  <Route path="places" element={<pages.Directory />} />
                  <Route path="inbox" element={<pages.Inbox />} />
                  <Route path="me/*" element={<pages.Me />} />
                  <Route path="manage/*" element={<pages.Manage />} />
                  <Route path="about" element={<pages.Info />} />
                  <Route path="privacy" element={<pages.Info />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
