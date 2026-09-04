import React, { useEffect } from 'react';
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
  const params = new URLSearchParams(window.location.search);
  const legal = params.get('legal');

  useEffect(() => {
    const isPrivatePage =
      Boolean(auth) ||
      Boolean(publicMatch) ||
      ['auth', 'invite', 'reset', 'verify'].some((key) => params.has(key)) ||
      legal === 'terms' ||
      legal === 'privacy' ||
      legal === 'lgpd';
    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute('content', isPrivatePage ? 'noindex, nofollow' : 'index, follow');

    if (publicMatch) document.title = 'Pedido | Confeiti';
    else if (legal) document.title = 'Documentos legais | Confeiti';
    else if (params.has('auth')) document.title = 'Entrar | Confeiti';
    else if (auth) document.title = 'Painel | Confeiti';
    else document.title = 'Confeiti | Sistema de gestão para confeitaria';
  }, [auth, legal, params, publicMatch]);

  if (publicMatch) return <PublicOrderPage token={publicMatch[1]} />;
  if (loading)
    return (
      <div className="min-h-screen bg-[#FFF8F2] flex items-center justify-center text-[#8D3157] font-semibold">
        Carregando…
      </div>
    );
  if (legal === 'terms' || legal === 'privacy' || legal === 'lgpd')
    return <LegalPage document={legal as LegalDocument} />;
  if (!auth) {
    const requiresAuthScreen = ['auth', 'invite', 'reset', 'verify'].some((key) => params.has(key));
    return requiresAuthScreen ? <AuthScreen /> : <LandingPage />;
  }
  return (
    <AppProvider>
      <App />
      <InstallAppPrompt />
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js').catch(() => undefined),
  );
}
