import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-4";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:opacity-90 text-white focus:ring-[var(--color-primary)]",
    outline:
      "border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-white hover:bg-blue-50 active:bg-blue-100 focus:ring-[var(--color-primary)]",
    ghost:
      "text-[var(--color-text-secondary)] hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
