import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');
const parseValue = (value: string) => {
  const [datePart, timePart = '12:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year || 2000, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
};
const toValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const monthLabel = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(firstDay);
      day.setDate(index - startOffset + 1);
      return day;
    });
  }, [visibleMonth]);

  const updateDate = (day: Date) => {
    const next = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      selected.getHours(),
      selected.getMinutes(),
    );
    onChange(toValue(next));
  };

  const updateTime = (field: 'hours' | 'minutes', rawValue: string) => {
    const next = new Date(selected);
    next[field === 'hours' ? 'setHours' : 'setMinutes'](Number(rawValue));
    onChange(toValue(next));
  };

  const displayValue = selected.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-[#7A6453]">{label}</label>
      <button
        type="button"
        onClick={() => {
          setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between rounded-2xl border border-[#EADDE2] bg-[#FFFCF8] px-3 py-3 text-left text-base font-medium text-[#302116] transition-colors hover:border-[#D69A88] focus:outline-none focus:ring-2 focus:ring-[#D69A88]/15"
        aria-label={label}
      >
        <span>{displayValue}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#96642F]" />
      </button>
      {required && (
        <input
          tabIndex={-1}
          value={value}
          onChange={() => undefined}
          required
          className="sr-only"
        />
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-[#E5DACD] bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                )
              }
              className="rounded-xl p-2 text-[#7A6453] transition-colors hover:bg-[#FFF1E8] hover:text-[#8D3157]"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold capitalize text-[#302116]">
              {monthLabel(visibleMonth)}
            </span>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                )
              }
              className="rounded-xl p-2 text-[#7A6453] transition-colors hover:bg-[#FFF1E8] hover:text-[#8D3157]"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#A89484]">
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = day.toDateString() === selected.toDateString();
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => updateDate(day)}
                  className={`h-8 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#96315C] font-bold text-white'
                      : isCurrentMonth
                        ? 'text-[#302116] hover:bg-[#FFF1E8]'
                        : 'text-[#C4B2A0] hover:bg-[#FCFAF8]'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-[#F0E7DE] pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#7A4B1D]">
              <Clock className="h-3.5 w-3.5" /> Horário
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={pad(selected.getHours())}
                onChange={(event) => updateTime('hours', event.target.value)}
                className="rounded-xl border border-[#EADDE2] bg-[#FFFCF8] px-2 py-2 text-sm font-semibold text-[#302116] focus:border-[#D69A88] focus:outline-none"
                aria-label="Hora"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour}>{pad(hour)}</option>
                ))}
              </select>
              <select
                value={pad(selected.getMinutes())}
                onChange={(event) => updateTime('minutes', event.target.value)}
                className="rounded-xl border border-[#EADDE2] bg-[#FFFCF8] px-2 py-2 text-sm font-semibold text-[#302116] focus:border-[#D69A88] focus:outline-none"
                aria-label="Minutos"
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const minutes = index * 5;
                  return <option key={minutes}>{pad(minutes)}</option>;
                })}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(
                  toValue(
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                      selected.getHours(),
                      selected.getMinutes(),
                    ),
                  ),
                );
                setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
              className="mt-3 w-full rounded-xl bg-[#FFF1E8] px-3 py-2 text-xs font-bold text-[#8D3157] transition-colors hover:bg-[#FBE2D4]"
            >
              Usar hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
