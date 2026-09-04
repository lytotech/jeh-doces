import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TextInput } from '../ui/Input';
import { formatCurrency, ORDER_STATUS_MAP } from '../../services/costEngine';
import { Commitment, Order } from '../../types';

type CalendarViewMode = 'month' | 'week' | 'day';
type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  kind: 'order' | 'commitment';
  order?: Order;
  commitment?: Commitment;
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));
const eventDate = (event: CalendarEvent) =>
  event.start.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const CalendarEventChip: React.FC<{
  event: CalendarEvent;
  compact?: boolean;
  onSelectOrder: (order: Order) => void;
  onDeleteCommitment: (id: string) => void;
}> = ({ event, compact, onSelectOrder, onDeleteCommitment }) => {
  const className =
    event.kind === 'order'
      ? 'border-[#DFCFC0] bg-[#F5ECE0] text-[#5E3A1C]'
      : 'border-[#EBD7BD] bg-[#FFF8EF] text-[#7A4B1D]';
  const details =
    event.kind === 'order'
      ? ` · ${ORDER_STATUS_MAP[event.order!.status]?.label} · ${formatCurrency(event.order!.totalCharged)}`
      : '';
  const content = (
    <>
      <strong className="block truncate text-xs font-semibold">{event.title}</strong>
      {!compact && (
        <span className="block truncate text-[11px] opacity-75">{eventDate(event)}</span>
      )}
    </>
  );
  if (event.kind === 'order')
    return (
      <button
        title={`${event.title} · ${eventDate(event)}${details}`}
        onClick={() => onSelectOrder(event.order!)}
        className={`w-full rounded-lg border px-2 py-1 text-left transition hover:brightness-95 ${className}`}
      >
        {content}
      </button>
    );
  return (
    <div
      title={`${event.title} · ${eventDate(event)}`}
      className={`flex items-start gap-1 rounded-lg border px-2 py-1 ${className}`}
    >
      <div className="min-w-0 flex-1">{content}</div>
      <button
        aria-label={`Excluir ${event.title}`}
        onClick={() => onDeleteCommitment(event.id)}
        className="shrink-0 rounded p-0.5 hover:bg-[#EBD7BD]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const CalendarGrid: React.FC<{
  cursor: Date;
  view: CalendarViewMode;
  events: CalendarEvent[];
  onSelectOrder: (order: Order) => void;
  onDeleteCommitment: (id: string) => void;
}> = ({ cursor, view, events, onSelectOrder, onDeleteCommitment }) => {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days =
    view === 'month'
      ? Array.from({ length: 42 }, (_, index) =>
          addDays(firstOfMonth, index - ((firstOfMonth.getDay() + 6) % 7)),
        )
      : view === 'week'
        ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index))
        : [startOfDay(cursor)];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        {view !== 'day' && (
          <div className="grid grid-cols-7 border-b border-[#E5DACD] bg-[#FCFAF8]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-[#8A7565]"
              >
                {day}
              </div>
            ))}
          </div>
        )}
        <div className={view === 'day' ? '' : 'grid grid-cols-7'}>
          {days.map((day, index) => {
            const dayEvents = events.filter((event) => sameDay(event.start, day));
            const isToday = sameDay(day, new Date());
            const outside = view === 'month' && day.getMonth() !== cursor.getMonth();
            const isLastMonthRow = view === 'month' && index >= days.length - 7;
            return (
              <div
                key={day.toISOString()}
                className={`${view === 'month' ? `min-h-[112px] border-b border-r border-[#E5DACD] ${isLastMonthRow ? 'border-b-0' : ''}` : 'min-h-[360px] border-x border-t border-[#E5DACD]'} ${outside ? 'bg-[#FCFAF8] text-[#B0A294]' : 'bg-white'} p-2`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? 'bg-[#96642F] font-bold text-white' : 'text-[#6F5A49]'}`}
                  >
                    {day.getDate()}
                  </span>
                  {view !== 'month' && (
                    <span className="text-xs text-[#9B8878]">
                      {day.toLocaleDateString('pt-BR', { weekday: 'long', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <CalendarEventChip
                      key={`${event.kind}-${event.id}`}
                      event={event}
                      compact={view === 'month'}
                      onSelectOrder={onSelectOrder}
                      onDeleteCommitment={onDeleteCommitment}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {view === 'day' && !events.some((event) => sameDay(event.start, days[0])) && (
          <p className="-mt-28 p-6 text-center text-sm text-[#8A7565]">
            Nenhum compromisso neste dia.
          </p>
        )}
      </div>
    </div>
  );
};

export const CalendarView: React.FC<{ onSelectOrder: (order: Order) => void }> = ({
  onSelectOrder,
}) => {
  const { orders, commitments, saveCommitmentAction, deleteCommitmentAction } = useApp();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<CalendarViewMode>('month');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const events = useMemo<CalendarEvent[]>(
    () => [
      ...orders.map((order) => ({
        id: order.id,
        title: order.clientName,
        start: new Date(order.deliveryDate),
        kind: 'order' as const,
        order,
      })),
      ...commitments.map((commitment) => ({
        id: commitment.id,
        title: commitment.title,
        start: new Date(commitment.startsAt),
        kind: 'commitment' as const,
        commitment,
      })),
    ],
    [orders, commitments],
  );
  const move = (amount: number) =>
    setCursor((previous) =>
      view === 'month'
        ? new Date(previous.getFullYear(), previous.getMonth() + amount, 1)
        : addDays(previous, view === 'week' ? amount * 7 : amount),
    );
  const save = async () => {
    if (!title.trim()) return;
    await saveCommitmentAction({ title, startsAt: new Date(startsAt).toISOString() });
    setTitle('');
    setShowForm(false);
  };
  const label =
    view === 'month'
      ? cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${startOfWeek(cursor).toLocaleDateString('pt-BR')} — ${addDays(startOfWeek(cursor), 6).toLocaleDateString('pt-BR')}`
        : cursor.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Calendário de compromissos"
        rightAction={
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Compromisso
          </Button>
        }
      />
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl border border-[#E5DACD] bg-white p-1">
            {(['month', 'week', 'day'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === item ? 'bg-[#96642F] text-white' : 'text-[#7A6453]'}`}
              >
                {item === 'month' ? 'Mês' : item === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Período anterior"
              size="sm"
              variant="secondary"
              onClick={() => move(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-48 text-center font-serif text-lg capitalize text-[#4A3828]">
              {label}
            </h2>
            <Button
              aria-label="Próximo período"
              size="sm"
              variant="secondary"
              onClick={() => move(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[#E5DACD] bg-white">
          <CalendarGrid
            cursor={cursor}
            view={view}
            events={events}
            onSelectOrder={onSelectOrder}
            onDeleteCommitment={(id) => void deleteCommitmentAction(id)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A6453]">
          <CalendarDays className="h-4 w-4" /> Entregas e compromissos independentes no mesmo
          calendário.
        </div>
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Novo compromisso">
        <div className="space-y-3">
          <TextInput
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Reunião com fornecedor"
            autoFocus
            required
          />
          <TextInput
            label="Data e hora"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void save()}>Salvar compromisso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
