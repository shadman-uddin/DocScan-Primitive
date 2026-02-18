import { ScanLine, User } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";

export default function TopBar() {
  const { appName, theme } = useAppStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
      style={{ height: 56, backgroundColor: theme.primaryColor }}
    >
      <div className="flex items-center gap-2">
        {theme.logoUrl ? (
          <img src={theme.logoUrl} alt={appName} className="h-7 w-7 object-contain" />
        ) : (
          <ScanLine className="h-6 w-6 text-white" />
        )}
        <span className="text-white font-semibold text-lg tracking-tight">
          {appName}
        </span>
      </div>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
        <User className="h-4 w-4 text-white" />
      </div>
    </header>
  );
}
