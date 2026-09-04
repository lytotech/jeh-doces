import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tone?: 'white' | 'soft' | 'cream';
}

const toneClasses = {
  white: 'bg-white border-[#E5DACD]',
  soft: 'bg-[#FCFAF8] border-[#E5DACD]',
  cream: 'bg-[#FFF6EE] border-[#E7D5BF]',
};

export const Card: React.FC<CardProps> = ({
  children,
  tone = 'white',
  className = '',
  ...props
}) => (
  <div className={`rounded-3xl border shadow-xs ${toneClasses[tone]} ${className}`} {...props}>
    {children}
  </div>
);
