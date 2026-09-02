import React, { useEffect, useRef, useState } from 'react';
import { Cake, Eye, EyeOff, Mail, LockKeyhole, User, Store } from 'lucide-react';
import { authRequest, useAuth } from '../../context/AuthContext';

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'resend' | 'verify';

export function AuthScreen() {
  const params = new URLSearchParams(window.location.search);
  const invite = params.get('invite') || undefined;
  const resetToken = params.get('reset');
  const verifyToken = params.get('verify');
  const requestedMode = params.get('auth');
  const [mode, setMode] = useState<Mode>(verifyToken ? 'verify' : resetToken ? 'reset' : invite || requestedMode === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, register, refresh } = useAuth();
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!verifyToken || verificationStarted.current) return;
    verificationStarted.current = true;
    setBusy(true);
    authRequest('/verify-email', { method: 'POST', body: JSON.stringify({ token: verifyToken }) })
      .then(async () => {
        history.replaceState({}, '', '/');
        setMessage('E-mail confirmado. Entrando…');
        await refresh();
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.'))
      .finally(() => setBusy(false));
  }, [refresh, verifyToken]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') await login(email, password, invite);
      if (mode === 'register') {
        const result = await register({ name, email, password, companyName, invitationToken: invite, acceptedTerms, acceptedPrivacy });
        setMode('resend'); setMessage(result.message); setPassword('');
      }
      if (mode === 'forgot') {
        const result = await authRequest<{ message: string }>('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        setMessage(result.message);
      }
      if (mode === 'reset') {
        await authRequest('/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, password }) });
        history.replaceState({}, '', '/'); setMode('login'); setMessage('Senha alterada. Entre com a nova senha.'); setPassword('');
      }
      if (mode === 'resend') {
        const result = await authRequest<{ message: string }>('/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
        setMessage(result.message);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro inesperado.'); }
    finally { setBusy(false); }
  };

  const inputClass = 'w-full rounded-2xl border border-[#E5DACD] bg-white py-3.5 pl-11 pr-4 text-[#382B20] placeholder:text-[#A99380] focus:border-[#96642F] focus:ring-2 focus:ring-[#B57E44]/15';
  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-[#B57E44] text-white flex items-center justify-center shadow-lg mb-4"><Cake size={32} /></div>
          <h1 className="font-serif text-3xl font-bold text-[#4A3423]">Jeh Doces</h1>
          <p className="text-[#8C7665] mt-1">Gestão simples para negócios doces</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-[2rem] border border-[#E8DECF] shadow-xl shadow-[#7A4B1D]/5 p-7 space-y-4">
          <div><h2 className="font-serif text-2xl font-bold text-[#4A3423]">{mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? (invite ? 'Aceitar convite' : 'Criar sua conta') : mode === 'forgot' ? 'Recuperar senha' : mode === 'reset' ? 'Nova senha' : mode === 'resend' ? 'Confirme seu e-mail' : 'Confirmando e-mail'}</h2>
          <p className="text-sm text-[#8C7665] mt-1">{mode === 'forgot' ? 'Enviaremos um link seguro para seu e-mail.' : mode === 'reset' ? 'Escolha uma senha com pelo menos 8 caracteres.' : mode === 'resend' ? 'Abra o link enviado. Ele é válido por 24 horas.' : mode === 'verify' ? 'Validando seu link seguro…' : 'Seus dados ficam separados por empresa.'}</p></div>
          {mode === 'register' && <>
            <label className="relative block"><User className="absolute left-4 top-4 text-[#A77A4D]" size={18}/><input className={inputClass} placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required /></label>
            {!invite && <label className="relative block"><Store className="absolute left-4 top-4 text-[#A77A4D]" size={18}/><input className={inputClass} placeholder="Nome da empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} required /></label>}
            <div className="space-y-2 rounded-2xl bg-[#FAF7F2] p-3 text-xs text-[#6B5747]">
              <label className="flex cursor-pointer items-start gap-2.5"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#96642F]" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} required/><span>Li e aceito os <a className="font-bold text-[#96642F] underline" href="/?legal=terms" target="_blank">Termos de Uso</a>.</span></label>
              <label className="flex cursor-pointer items-start gap-2.5"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#96642F]" checked={acceptedPrivacy} onChange={event => setAcceptedPrivacy(event.target.checked)} required/><span>Li a <a className="font-bold text-[#96642F] underline" href="/?legal=privacy" target="_blank">Política de Privacidade</a> e estou ciente do tratamento dos dados.</span></label>
            </div>
          </>}
          {!['reset', 'verify'].includes(mode) && <label className="relative block"><Mail className="absolute left-4 top-4 text-[#A77A4D]" size={18}/><input type="email" className={inputClass} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={Boolean(invite)} /></label>}
          {!['forgot', 'resend', 'verify'].includes(mode) && <label className="relative block"><LockKeyhole className="absolute left-4 top-4 text-[#A77A4D]" size={18}/><input type={showPassword ? 'text' : 'password'} minLength={8} className={`${inputClass} pr-11`} placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className="absolute right-4 top-4 text-[#8C7665]" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></label>}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {mode !== 'verify' && <button disabled={busy} className="w-full rounded-2xl bg-[#96642F] py-3.5 font-bold text-white hover:bg-[#7A4B1D] disabled:opacity-60">{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar acesso' : mode === 'forgot' ? 'Enviar instruções' : mode === 'resend' ? 'Reenviar confirmação' : 'Alterar senha'}</button>}
          <div className="text-center text-sm space-y-2">
            {mode === 'login' && <><button type="button" className="block w-full text-[#96642F]" onClick={() => setMode('forgot')}>Esqueci minha senha</button><button type="button" className="block w-full text-[#96642F]" onClick={() => setMode('resend')}>Reenviar confirmação</button><button type="button" className="text-[#5C4533]" onClick={() => setMode('register')}>Ainda não tenho conta</button></>}
            {mode !== 'login' && <button type="button" className="text-[#96642F]" onClick={() => { history.replaceState({}, '', '/'); setMode('login'); setError(''); setMessage(''); }}>{invite ? 'Já tenho uma conta' : 'Voltar para o login'}</button>}
          </div>
          <a href="/" className="block text-center text-xs font-semibold text-[#8C7665] hover:text-[#96642F]">← Voltar para o início</a>
        </form>
      </div>
    </main>
  );
}
