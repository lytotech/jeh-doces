import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TextInput } from '../ui/Input';
import { formatCurrency, ORDER_STATUS_MAP } from '../../services/costEngine';
import { Order } from '../../types';

type CalendarEvent = { id: string; title: string; date: Date; kind: 'order' | 'commitment'; order?: Order };

export const CalendarView: React.FC<{ onSelectOrder: (order: Order) => void }> = ({ onSelectOrder }) => {
  const { orders, commitments, saveCommitmentAction, deleteCommitmentAction } = useApp();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const events = useMemo<CalendarEvent[]>(() => [...orders.map(order => ({ id: order.id, title: order.clientName, date: new Date(order.deliveryDate), kind: 'order' as const, order })), ...commitments.map(item => ({ id: item.id, title: item.title, date: new Date(item.startsAt), kind: 'commitment' as const }))], [orders, commitments]);
  const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  const rangeStart = view === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth(), 1) : view === 'week' ? new Date(dayStart.getTime() - (((dayStart.getDay() + 6) % 7) * 86400000)) : dayStart;
  const rangeEnd = view === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59) : view === 'week' ? new Date(rangeStart.getTime() + 6 * 86400000 + 86399999) : new Date(dayStart.getTime() + 86399999);
  const visible = events.filter(event => event.date >= rangeStart && event.date <= rangeEnd).sort((a, b) => a.date.getTime() - b.date.getTime());
  const move = (amount: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + (view === 'month' ? amount : view === 'week' ? amount * 7 : amount)));
  const save = async () => { if (!title.trim()) return; await saveCommitmentAction({ title, startsAt: new Date(startsAt).toISOString() }); setTitle(''); setShowForm(false); };
  const label = view === 'month' ? cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : `${rangeStart.toLocaleDateString('pt-BR')} — ${rangeEnd.toLocaleDateString('pt-BR')}`;
  return <div className="min-h-screen bg-[#FAF7F2]"><AppHeader title="Calendário de compromissos" rightAction={<Button size="sm" onClick={() => setShowForm(true)}>+ Compromisso</Button>} /><div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1 bg-white border border-[#E5DACD] rounded-xl p-1">{(['month', 'week', 'day'] as const).map(item => <button key={item} onClick={() => setView(item)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === item ? 'bg-[#96642F] text-white' : 'text-[#7A6453]'}`}>{item === 'month' ? 'Mês' : item === 'week' ? 'Semana' : 'Dia'}</button>)}</div><div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => move(-1)}><ChevronLeft className="w-4 h-4" /></Button><h2 className="font-serif text-lg capitalize text-[#4A3828] min-w-48 text-center">{label}</h2><Button size="sm" variant="secondary" onClick={() => move(1)}><ChevronRight className="w-4 h-4" /></Button></div></div><div className="bg-white rounded-3xl border border-[#E5DACD] p-4 space-y-2">{visible.length === 0 ? <p className="py-12 text-center text-sm text-[#8A7565]">Nenhum compromisso neste período.</p> : visible.map(event => <div key={`${event.kind}-${event.id}`} className={`flex items-center gap-3 rounded-2xl border p-3 ${event.kind === 'order' ? 'border-[#DFCFC0] bg-[#F5ECE0]' : 'border-[#EBD7BD] bg-[#FFF8EF]'}`}>{event.kind === 'order' ? <button onClick={() => onSelectOrder(event.order!)} className="flex-1 text-left"><strong className="block text-sm text-[#302116]">{event.title}</strong><span className="text-xs text-[#7A6453]">{event.date.toLocaleString('pt-BR')} · {ORDER_STATUS_MAP[event.order!.status]?.label} · {formatCurrency(event.order!.totalCharged)}</span></button> : <div className="flex-1"><strong className="block text-sm text-[#302116]">{event.title}</strong><span className="text-xs text-[#7A6453]">{event.date.toLocaleString('pt-BR')}</span></div>}{event.kind === 'commitment' && <button onClick={() => void deleteCommitmentAction(event.id)} className="p-2 text-[#96642F] hover:bg-[#F5ECE0] rounded-xl"><Trash2 className="w-4 h-4" /></button>}</div>)}</div><div className="flex items-center gap-2 text-xs text-[#7A6453]"><CalendarDays className="w-4 h-4" /> Entregas e compromissos independentes no mesmo calendário.</div></div><Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Novo compromisso"><div className="space-y-3"><TextInput label="Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião com fornecedor" autoFocus required /><TextInput label="Data e hora" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} required /><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={() => void save()}>Salvar compromisso</Button></div></div></Modal></div>;
};
