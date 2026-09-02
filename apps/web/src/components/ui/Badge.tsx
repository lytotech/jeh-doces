import React from 'react';
import { OrderStatus } from '../../types';
import { ORDER_STATUS_MAP } from '../../services/costEngine';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.orcamento;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.badgeBg} ${config.badgeText} ${sizeClass}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: config.accentColor }}
      />
      {config.label}
    </span>
  );
};

interface TagBadgeProps {
  children: React.ReactNode;
  variant?: 'material' | 'subtle' | 'gold' | 'success';
}

export const TagBadge: React.FC<TagBadgeProps> = ({ children, variant = 'subtle' }) => {
  const styles = {
    material: 'bg-[#EDE4D8] text-[#78542A] border border-[#DFCFC0]',
    subtle: 'bg-[#F2ECE1] text-[#7A6453]',
    gold: 'bg-amber-100 text-amber-900 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
