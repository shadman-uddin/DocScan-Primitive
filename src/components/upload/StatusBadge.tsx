import { Check, X, Clock } from "lucide-react";
import type { Upload } from "../../stores/useUploadStore";

interface StatusBadgeProps {
  status: Upload["status"];
}

const statusConfig = {
  pending_review: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-700",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    bg: "bg-green-100",
    text: "text-green-700",
    Icon: Check,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-100",
    text: "text-red-700",
    Icon: X,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
