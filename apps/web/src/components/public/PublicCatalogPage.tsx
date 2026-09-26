import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { api, PublicCatalog } from '../../services/api';
import { formatCurrency } from '../../services/costEngine';

type Cart = Record<string, number>;

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          size?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      execute: (widgetId?: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const createSubmissionId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const PublicCatalogPage: React.FC<{ slug: string }> = ({ slug }) => {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<Cart>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [sending, setSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = React.useRef<HTMLDivElement>(null);
  const captchaWidgetRef = React.useRef<string | undefined>(undefined);
  const submissionIdRef = React.useRef(createSubmissionId());
  const [confirmation, setConfirmation] = useState<{ number: string; total: number } | null>(null);

  useEffect(() => {
    void api
      .getPublicCatalog(slug)
      .then(setCatalog)
      .catch(() => setError('Não encontramos esse catálogo ou ele está indisponível.'));
  }, [slug]);

  useEffect(() => {
    if (!turnstileSiteKey || !checkoutOpen || !captchaRef.current) return;
    const render = () => {
      if (!captchaRef.current || !window.turnstile || captchaWidgetRef.current) return;
      captchaWidgetRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: turnstileSiteKey,
        size: 'invisible',
        callback: setCaptchaToken,
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      });
      window.turnstile.execute(captchaWidgetRef.current);
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => {
      if (captchaWidgetRef.current && window.turnstile) {
        window.turnstile.reset(captchaWidgetRef.current);
        captchaWidgetRef.current = undefined;
      }
    };
  }, [checkoutOpen]);

  const products = useMemo(() => {
    if (!catalog) return [];
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return catalog.products.filter(
      (product) =>
        (category === 'Todos' || product.category === category) &&
        (!term ||
          `${product.name} ${product.description ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)),
    );
  }, [catalog, category, search]);
  const cartItems = useMemo(
    () => catalog?.products.filter((product) => cart[product.id]) ?? [],
    [catalog, cart],
  );
  const total = cartItems.reduce((sum, product) => sum + product.salePrice * cart[product.id], 0);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const changeQuantity = (id: string, delta: number) => {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      const updated = { ...current };
      if (next) updated[id] = next;
      else delete updated[id];
      return updated;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemCount || sending) return;
    setSending(true);
    try {
      const result = await api.submitPublicCatalogOrder(slug, {
        customer: { name, phone },
        items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
        submissionId: submissionIdRef.current,
        captchaToken: captchaToken || undefined,
        website: '',
        notes: notes.trim() || undefined,
        deliveryDate: deliveryDate || undefined,
      });
      setConfirmation({
        number: result.orderNumber.replace(/^#+/, ''),
        total: result.totalCharged,
      });
      setCart({});
      setCheckoutOpen(false);
      submissionIdRef.current = createSubmissionId();
      setCaptchaToken('');
    } catch {
      setError('Não foi possível enviar seu pedido. Confira os dados e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (error)
    return (
      <main className="min-h-screen bg-[#FFF8F2] p-8 text-center text-[#72203F]">{error}</main>
    );
  if (!catalog)
    return (
      <main className="min-h-screen bg-[#FFF8F2] p-8 text-center text-[#72203F]">
        Carregando catálogo…
      </main>
    );
  if (confirmation)
    return (
      <main className="min-h-screen bg-[#FFF8F2] p-4 flex items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm border border-[#E8DECF]">
          <Check className="mx-auto h-14 w-14 rounded-full bg-[#E5F6ED] p-3 text-[#087F5B]" />
          <h1 className="mt-5 text-2xl font-bold text-[#302116]">Pedido enviado!</h1>
          <p className="mt-2 text-[#7A6453]">Recebemos seu orçamento #{confirmation.number}.</p>
          <p className="mt-5 text-xl font-bold text-[#96315C]">
            {formatCurrency(confirmation.total)}
          </p>
          <p className="mt-4 text-sm text-[#7A6453]">
            A loja entrará em contato pelo WhatsApp para confirmar os detalhes.
          </p>
        </section>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#FFF8F2] text-[#302116]">
      <header className="bg-[#96315C] px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-white/75">Catálogo da loja</p>
          <h1 className="mt-1 text-3xl font-bold">{catalog.storeName}</h1>
          {catalog.storePhone && (
            <p className="mt-2 text-sm text-white/80">WhatsApp: {catalog.storePhone}</p>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-2xl border border-[#E8DECF] bg-white px-4 py-3 outline-none md:max-w-md"
            placeholder="Buscar produto…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#72203F] px-5 py-3 font-semibold text-white"
            onClick={() => setCheckoutOpen(true)}
            disabled={!itemCount}
          >
            <ShoppingBag className="h-5 w-5" /> Carrinho ({itemCount}) · {formatCurrency(total)}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {['Todos', ...catalog.categories].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm ${category === item ? 'bg-[#96315C] text-white' : 'bg-white text-[#7A6453] border border-[#E8DECF]'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-3xl border border-[#E8DECF] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-3xl">{product.icon || '🧁'}</span>
                  <h2 className="mt-3 text-lg font-bold">{product.name}</h2>
                  <p className="text-xs text-[#96315C]">{product.category}</p>
                </div>
                <strong className="text-[#96315C]">{formatCurrency(product.salePrice)}</strong>
              </div>
              {product.description && (
                <p className="mt-3 text-sm text-[#7A6453]">{product.description}</p>
              )}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm text-[#7A6453]">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => changeQuantity(product.id, -1)}
                    className="rounded-full border p-1"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center font-semibold">{cart[product.id] ?? 0}</span>
                  <button
                    onClick={() => changeQuantity(product.id, 1)}
                    className="rounded-full bg-[#96315C] p-1 text-white"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!products.length && (
          <p className="py-16 text-center text-[#7A6453]">Nenhum produto encontrado.</p>
        )}
      </div>
      {checkoutOpen && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4">
          <form
            onSubmit={(event) => void submit(event)}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 md:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Finalizar pedido</h2>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-[#7A6453]"
              >
                Fechar
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {cartItems.map((product) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>
                    {cart[product.id]}× {product.name}
                  </span>
                  <strong>{formatCurrency(product.salePrice * cart[product.id])}</strong>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
                name="website"
                value=""
                onChange={() => undefined}
              />
              <label className="text-sm font-semibold">
                Seu nome
                <input
                  required
                  minLength={2}
                  className="mt-1 w-full rounded-xl border p-3 font-normal"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                WhatsApp
                <input
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-xl border p-3 font-normal"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                Data de entrega (opcional)
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border p-3 font-normal"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                Observação (opcional)
                <textarea
                  className="mt-1 w-full rounded-xl border p-3 font-normal"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              {turnstileSiteKey && <div ref={captchaRef} aria-hidden="true" />}
              <button
                disabled={sending}
                className="rounded-xl bg-[#96315C] px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {sending ? 'Enviando…' : 'Enviar pedido'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
