import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { LandingPage } from './components/landing/LandingPage';
import { LegalDocument, LegalPage } from './components/legal/LegalPage';
import './index.css';
import { PublicOrderPage } from './components/public/PublicOrderPage';
import { InstallAppPrompt } from './components/pwa/InstallAppPrompt';

function Root() {
  const { auth, loading } = useAuth();
  const publicMatch = window.location.pathname.match(/^\/pedido\/([^/]+)$/);
  if (publicMatch) return <PublicOrderPage token={publicMatch[1]} />;
  if (loading) return <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#96642F] font-semibold">Carregando…</div>;
  const params = new URLSearchParams(window.location.search);
  const legal = params.get('legal');
  if (legal === 'terms' || legal === 'privacy' || legal === 'lgpd') return <LegalPage document={legal as LegalDocument} />;
  if (!auth) {
    const requiresAuthScreen = ['auth', 'invite', 'reset', 'verify'].some(key => params.has(key));
    return requiresAuthScreen ? <AuthScreen /> : <LandingPage />;
  }
  return <AppProvider><App /><InstallAppPrompt /></AppProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider><Root /></AuthProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
