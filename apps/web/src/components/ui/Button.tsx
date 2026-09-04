import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'caramel-outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-[#96642F] hover:bg-[#835525] text-white shadow-sm hover:shadow active:bg-[#6E461D]',
    secondary: 'bg-[#F4ECE0] hover:bg-[#E8DAC6] text-[#7A4B1D] font-semibold',
    outline: 'border border-[#D7BC9B] bg-white text-[#7A4B1D] hover:bg-[#FAF5EE]',
    'caramel-outline': 'border border-[#96642F] text-[#96642F] bg-transparent hover:bg-[#FAF5EE]',
    danger: 'border border-rose-300 text-rose-600 bg-white hover:bg-rose-50',
    ghost: 'text-[#7A4B1D] hover:bg-[#F4ECE0] bg-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
