import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import './index.css';

function Root() {
  const { auth, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#96642F] font-semibold">Carregando…</div>;
  if (!auth) return <AuthScreen />;
  return <AppProvider><App /></AppProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider><Root /></AuthProvider>
  </React.StrictMode>,
);
