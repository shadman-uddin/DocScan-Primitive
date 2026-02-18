import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  valueColor?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  valueColor,
}: StatsCardProps) {
  return (
    <div className="flex-1 bg-[var(--color-card-bg)] rounded-lg shadow-sm p-3 flex flex-col items-center">
      <Icon className="h-4 w-4 mb-1" style={{ color: "var(--color-text-secondary)" }} />
      <span
        className="text-2xl font-bold leading-tight"
        style={{ color: valueColor || "var(--color-text-primary)" }}
      >
        {value}
      </span>
      <span
        className="text-[10px] mt-0.5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
    </div>
  );
}
