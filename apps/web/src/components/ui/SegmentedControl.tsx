import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`grid grid-flow-col auto-cols-fr gap-2.5 ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-3 px-4 rounded-xl text-center text-sm font-semibold transition-all duration-200 border ${
              isSelected
                ? 'bg-[#96642F] text-white border-[#96642F] shadow-sm'
                : 'bg-[#FCFAF8] text-[#7A4B1D] border-[#D7BC9B] hover:bg-[#F6ECE0]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
