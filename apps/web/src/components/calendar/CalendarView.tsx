import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { formatCurrency, formatDateTime, ORDER_STATUS_MAP } from '../../services/costEngine';
import { Order } from '../../types';

export const CalendarView: React.FC<{ onSelectOrder: (order: Order) => void }> = ({ onSelectOrder }) => {
  const { orders } = useApp();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((start + days) / 7) * 7 }, (_, i) => i - start + 1);
  const byDay = useMemo(() => orders.reduce<Record<number, Order[]>>((acc, order) => { const d = new Date(order.deliveryDate); if (d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()) (acc[d.getDate()] ||= []).push(order); return acc; }, {}), [orders, month]);
  const title = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return <div className="min-h-screen bg-[#FAF7F2]"><AppHeader title="Calendário de compromissos" /><div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4"><div className="flex items-center justify-between"><Button size="sm" variant="secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /> Anterior</Button><h2 className="font-serif text-xl capitalize text-[#4A3828]">{title}</h2><Button size="sm" variant="secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Próximo <ChevronRight className="w-4 h-4" /></Button></div><div className="bg-white rounded-3xl border border-[#E5DACD] overflow-hidden"><div className="grid grid-cols-7 bg-[#F5ECE0] text-center text-[11px] uppercase font-bold text-[#7A6453]">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <div key={d} className="py-3">{d}</div>)}</div><div className="grid grid-cols-7">{cells.map(day => <div key={day} className={`min-h-28 sm:min-h-36 p-1.5 border-t border-r border-[#F0E9E1] ${day < 1 || day > days ? 'bg-[#FCFAF8]' : ''}`}>{day > 0 && day <= days && <><span className="text-xs font-semibold text-[#7A6453]">{day}</span><div className="space-y-1 mt-1">{(byDay[day] || []).map(order => <button key={order.id} onClick={() => onSelectOrder(order)} className="w-full text-left rounded-lg bg-[#F5ECE0] border border-[#DFCFC0] px-1.5 py-1 text-[10px] text-[#5C381B] hover:bg-[#EBD7BD]"><strong className="block truncate">{new Date(order.deliveryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {order.clientName}</strong><span className="truncate block">{ORDER_STATUS_MAP[order.status]?.label} · {formatCurrency(order.totalCharged)}</span></button>)}</div></>}</div>)}</div></div><div className="flex items-center gap-2 text-xs text-[#7A6453]"><CalendarDays className="w-4 h-4" /> Cada compromisso é baseado na data de entrega da encomenda. Clique para abrir os detalhes.</div></div></div>;
};
