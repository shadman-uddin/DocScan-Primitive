import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: string;
}

export default function Card({
  children,
  padding = "p-4",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[var(--color-card-bg)] rounded-lg shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
