import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Cake,
  Check,
  CheckCircle2,
  ClipboardList,
  Cookie,
  DollarSign,
  Menu,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const goToAuth = (mode: 'login' | 'register') => {
  window.location.href = `/?auth=${mode}`;
};

const features = [
  { icon: ClipboardList, title: 'Encomendas organizadas', text: 'Acompanhe cada pedido do orçamento à entrega, com datas, itens e status em um só lugar.' },
  { icon: DollarSign, title: 'Preço com lucro de verdade', text: 'Calcule custos, margem e lucro estimado sem depender de planilhas espalhadas.' },
  { icon: Cookie, title: 'Fichas técnicas e receitas', text: 'Cadastre ingredientes, rendimentos e embalagens para conhecer o custo de cada produto.' },
  { icon: Package, title: 'Estoque sob controle', text: 'Registre materiais, acompanhe quantidades e receba alertas antes que algo acabe.' },
  { icon: BarChart3, title: 'Visão clara do negócio', text: 'Veja faturamento, pagamentos, custos e próximas entregas em um painel simples.' },
  { icon: Users, title: 'Sua equipe no mesmo ritmo', text: 'Convide funcionários e mantenha os dados de cada empresa separados e protegidos.' },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FCF9F4] text-[#382B20]">
      <header className="relative z-20 border-b border-[#E9DDCE]/80 bg-[#FCF9F4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="Jeh Doces — início">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A86F35] text-white shadow-lg shadow-[#7A4B1D]/15"><Cake size={22} /></span>
            <span><strong className="block font-serif text-xl leading-none text-[#4A3423]">Jeh Doces</strong><span className="text-[11px] font-medium text-[#8C7665]">Gestão para confeitaria</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#6B5747] md:flex" aria-label="Navegação principal">
            <a href="#recursos" className="hover:text-[#96642F]">Recursos</a>
            <a href="#como-funciona" className="hover:text-[#96642F]">Como funciona</a>
            <a href="#seguranca" className="hover:text-[#96642F]">Segurança</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button onClick={() => goToAuth('login')} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#7A4B1D] hover:bg-[#F4ECE0]">Entrar</button>
            <button onClick={() => goToAuth('register')} className="rounded-xl bg-[#96642F] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#7A4B1D]/15 transition hover:-translate-y-0.5 hover:bg-[#835525]">Criar conta</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl p-2 text-[#6B5747] md:hidden" aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="border-t border-[#E9DDCE] bg-white px-5 py-5 md:hidden"><div className="flex flex-col gap-4 text-sm font-semibold"><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#seguranca">Segurança</a><button onClick={() => goToAuth('login')} className="rounded-xl border border-[#D7BC9B] py-3 text-[#7A4B1D]">Entrar</button><button onClick={() => goToAuth('register')} className="rounded-xl bg-[#96642F] py-3 text-white">Criar conta</button></div></div>}
      </header>

      <section className="relative">
        <div className="absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#EFDCC5]/60 blur-3xl" />
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-[#F4E8D8] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DFC7AA] bg-white/80 px-3.5 py-2 text-xs font-bold text-[#845025] shadow-sm"><Sparkles size={14} /> Feito para quem transforma carinho em negócio</div>
            <h1 className="max-w-2xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#3D2A1C] sm:text-6xl lg:text-7xl">Menos planilhas.<br/><span className="text-[#A86F35]">Mais tempo para criar.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#715D4D]">Organize encomendas, descubra o custo real das suas receitas e acompanhe o lucro da confeitaria em um sistema simples, bonito e seguro.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => goToAuth('register')} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#96642F] px-7 py-4 font-bold text-white shadow-xl shadow-[#7A4B1D]/20 transition hover:-translate-y-0.5 hover:bg-[#835525]">Começar agora <ArrowRight className="transition-transform group-hover:translate-x-1" size={18}/></button>
              <a href="#recursos" className="inline-flex items-center justify-center rounded-2xl border border-[#D8C5B0] bg-white px-7 py-4 font-bold text-[#6B4930] transition hover:bg-[#F8F1E8]">Conhecer recursos</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#7A6453]"><span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600"/> Acesso pelo celular e computador</span><span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600"/> Dados separados por empresa</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-5 rotate-2 rounded-[2.5rem] bg-[#D8B58E]/25" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#E1D2C1] bg-white shadow-2xl shadow-[#5A3820]/15">
              <div className="flex items-center justify-between border-b border-[#EEE4D9] px-5 py-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#D8B58E]"/><span className="h-2.5 w-2.5 rounded-full bg-[#EBDAC6]"/><span className="h-2.5 w-2.5 rounded-full bg-[#F2E9DF]"/></div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#A08A77]">Visão do negócio</span></div>
              <div className="grid gap-4 bg-[#FAF7F2] p-5 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#A86F35] p-4 text-white sm:col-span-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#F7E7D5]">Lucro estimado</span><strong className="mt-3 block font-serif text-3xl">R$ 4.820</strong><span className="mt-3 block border-t border-white/20 pt-2 text-[10px] text-[#F7E7D5]">Receita no mês: R$ 8.450</span></div>
                <div className="rounded-2xl border border-[#E7DBCE] bg-white p-4"><span className="text-[10px] font-bold uppercase text-[#8A7565]">Encomendas</span><strong className="mt-3 block text-3xl text-[#3D2A1C]">18</strong><span className="mt-3 block text-[10px] font-semibold text-purple-700">4 em produção</span></div>
                <div className="rounded-2xl border border-[#E7DBCE] bg-white p-4"><span className="text-[10px] font-bold uppercase text-[#8A7565]">Recebido</span><strong className="mt-3 block text-3xl text-emerald-700">72%</strong><span className="mt-3 block text-[10px] text-[#8A7565]">Pagamentos do mês</span></div>
              </div>
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-[#E7DBCE] p-4"><div className="mb-4 flex items-center justify-between"><strong className="text-sm">Próximas entregas</strong><span className="text-[10px] font-bold text-[#96642F]">Ver todas</span></div>{['Bolo de aniversário','Caixa de brigadeiros','Brownies personalizados'].map((item,index)=><div key={item} className="flex items-center justify-between border-t border-[#F2ECE5] py-2.5 text-xs"><div><strong className="block text-[#4A3423]">{item}</strong><span className="text-[10px] text-[#9A8674]">{index + 3} de setembro</span></div><span className={`rounded-md px-2 py-1 text-[9px] font-bold ${index === 0 ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}`}>{index === 0 ? 'Produzindo' : 'Confirmado'}</span></div>)}</div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><div className="flex items-center gap-2 text-xs font-bold text-amber-900"><Package size={15}/> Estoque baixo</div><div className="mt-4 space-y-2"><div className="rounded-xl bg-white p-3 text-xs"><strong className="block">Caixa kraft</strong><span className="text-amber-700">Restam 5 unidades</span></div><div className="rounded-xl bg-white p-3 text-xs"><strong className="block">Chocolate 50%</strong><span className="text-amber-700">Restam 800 g</span></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-2xl text-center"><span className="text-xs font-bold uppercase tracking-[.22em] text-[#A86F35]">Tudo no lugar certo</span><h2 className="mt-3 font-serif text-4xl font-bold text-[#3D2A1C] sm:text-5xl">Da receita à entrega, você no controle</h2><p className="mt-4 text-[#766252]">As ferramentas essenciais para cuidar da operação sem perder a delicadeza do seu negócio.</p></div><div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,text})=><article key={title} className="group rounded-3xl border border-[#E9DED2] bg-[#FCFAF7] p-6 transition hover:-translate-y-1 hover:border-[#D7BC9B] hover:shadow-xl hover:shadow-[#7A4B1D]/5"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E2D2] text-[#8A5727] transition group-hover:bg-[#A86F35] group-hover:text-white"><Icon size={22}/></span><h3 className="mt-5 text-lg font-bold text-[#3D2A1C]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#7A6655]">{text}</p></article>)}</div></div>
      </section>

      <section id="como-funciona" className="py-20 lg:py-28"><div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-8"><div><span className="text-xs font-bold uppercase tracking-[.22em] text-[#A86F35]">Simples desde o primeiro dia</span><h2 className="mt-3 font-serif text-4xl font-bold text-[#3D2A1C]">Seu negócio organizado em três passos</h2><div className="mt-8 space-y-7">{[['01','Cadastre sua base','Adicione ingredientes, embalagens e receitas com seus custos.'],['02','Receba e acompanhe pedidos','Crie orçamentos e mova cada encomenda pelo fluxo de produção.'],['03','Decida com segurança','Acompanhe recebimentos, margem, lucro e necessidades de estoque.']].map(([number,title,text])=><div key={number} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8B58E] bg-white font-serif font-bold text-[#96642F]">{number}</span><div><h3 className="font-bold text-[#3D2A1C]">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[#7A6655]">{text}</p></div></div>)}</div></div><div id="seguranca" className="rounded-[2rem] bg-[#422D20] p-8 text-white shadow-2xl sm:p-10"><ShieldCheck size={36} className="text-[#E2BC8C]"/><h3 className="mt-6 font-serif text-3xl font-bold">Seu trabalho merece proteção</h3><p className="mt-3 leading-relaxed text-[#EADFD5]">Cada empresa acessa somente seus próprios dados. Contas usam senha protegida, sessão segura e confirmação de e-mail.</p><ul className="mt-7 space-y-3 text-sm text-[#F7EEE6]">{['Dados isolados por empresa','Acesso individual para funcionários','Recuperação segura de senha','Conexão HTTPS no acesso público'].map(item=><li key={item} className="flex items-center gap-2"><span className="rounded-full bg-white/10 p-1"><Check size={13}/></span>{item}</li>)}</ul></div></div></section>

      <section className="px-5 pb-20 lg:px-8"><div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#A86F35] px-6 py-12 text-center text-white shadow-2xl shadow-[#7A4B1D]/20 sm:px-12"><Cake className="mx-auto text-[#F5D7B5]" size={36}/><h2 className="mt-5 font-serif text-4xl font-bold">Pronta para adoçar a gestão?</h2><p className="mx-auto mt-3 max-w-xl text-[#F8E9D9]">Crie sua conta e transforme a rotina da sua confeitaria em um processo mais leve e lucrativo.</p><button onClick={() => goToAuth('register')} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-[#7A4B1D] transition hover:-translate-y-0.5 hover:shadow-xl">Criar minha conta <ArrowRight size={18}/></button></div></section>

      <footer className="border-t border-[#E9DDCE] bg-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-xs text-[#8A7565] sm:flex-row lg:px-8"><div className="flex items-center gap-2 font-serif text-base font-bold text-[#4A3423]"><Cake size={18} className="text-[#A86F35]"/> Jeh Doces</div><span>Gestão simples para negócios doces.</span><button onClick={() => goToAuth('login')} className="font-bold text-[#96642F]">Acessar minha conta</button></div></footer>
    </main>
  );
}
