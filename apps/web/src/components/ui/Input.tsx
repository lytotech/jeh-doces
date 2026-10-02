import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helpText,
  className = '',
  children,
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative border border-[#EADDE2] focus-within:border-[#D69A88] focus-within:ring-2 focus-within:ring-[#D69A88]/15 rounded-2xl bg-[#FFFCF8] p-3 transition-colors shadow-xs">
        <label htmlFor={htmlFor} className="block text-xs font-medium text-[#7A6453] mb-1">
          {label}
        </label>
        {children}
      </div>
      {helpText && <p className="text-xs text-[#8A7565] mt-1.5 px-1">{helpText}</p>}
      {error && (
        <p role="alert" className="text-xs text-rose-500 mt-1 px-1">
          {error}
        </p>
      )}
    </div>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  if (label) {
    return (
      <FormField label={label} htmlFor={inputId} error={error} helpText={helpText}>
        <input
          id={inputId}
          className={`w-full bg-transparent text-[#302116] font-medium text-base placeholder-[#B0A294] focus:outline-none ${className}`}
          {...props}
        />
      </FormField>
    );
  }

  return (
    <input
      id={inputId}
      className={`w-full px-4 py-3 bg-[#FFFCF8] border border-[#EADDE2] focus:border-[#D69A88] focus:ring-2 focus:ring-[#D69A88]/15 rounded-2xl text-[#302116] font-medium placeholder-[#B0A294] transition-colors ${className}`}
      {...props}
    />
  );
};

interface SwitchProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  sublabel,
  checked,
  onChange,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between cursor-pointer select-none py-2 text-left ${className}`}
    >
      <div className="pr-4 flex-1">
        <span className="text-base font-semibold text-[#302116] block">{label}</span>
        {sublabel && (
          <span className="text-xs text-[#7A6453] mt-0.5 leading-relaxed">{sublabel}</span>
        )}
      </div>
      <div
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          checked ? 'bg-[#96642F]' : 'bg-[#D6CBC0]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
};
