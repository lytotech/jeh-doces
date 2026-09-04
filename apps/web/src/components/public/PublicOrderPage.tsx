import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { formatCurrency, formatDateTime, ORDER_STATUS_MAP } from '../../services/costEngine';

export const PublicOrderPage: React.FC<{ token: string }> = ({ token }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(`/api/public/orders/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrder)
      .catch(() => setError(true));
  }, [token]);
  if (error)
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#E5DACD] p-8 text-center">
          <h1 className="font-serif text-2xl text-[#4A3828]">Link indisponível</h1>
          <p className="mt-2 text-sm text-[#7A6453]">
            Este link não existe ou não está mais disponível.
          </p>
        </div>
      </main>
    );
  if (!order)
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#96642F]">
        Carregando pedido…
      </main>
    );
  return (
    <main className="min-h-screen bg-[#FAF7F2] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="bg-[#B57E44] text-white rounded-3xl p-6">
          <p className="text-amber-100 text-sm">Confeiti</p>
          <h1 className="font-serif text-3xl mt-1">Pedido #{order.orderNumber}</h1>
          <p className="mt-3 text-sm">Entrega: {formatDateTime(order.deliveryDate)}</p>
        </header>
        <section className="bg-white rounded-3xl border border-[#E5DACD] p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-[#7A4B1D]">
            Olá, {order.clientName}
          </p>
          <p className="mt-2 text-sm text-[#7A6453]">
            Status:{' '}
            <strong className="text-[#302116]">{ORDER_STATUS_MAP[order.status]?.label}</strong>
          </p>
        </section>
        <section className="bg-white rounded-3xl border border-[#E5DACD] p-5 space-y-3">
          <h2 className="font-bold text-[#302116]">Itens do pedido</h2>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 border-b border-[#F0E9E1] py-2 text-sm"
            >
              <span>
                {item.quantity}× {item.productName}
              </span>
              <strong>{formatCurrency(item.totalPrice)}</strong>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold text-[#302116]">
            <span>Total</span>
            <span>{formatCurrency(order.totalCharged)}</span>
          </div>
        </section>
        <p className="text-center text-xs text-[#9B8878]">
          Acompanhe as atualizações por este link.
        </p>
      </div>
    </main>
  );
};
