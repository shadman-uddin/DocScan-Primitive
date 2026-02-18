import { Upload, ClipboardCheck, BarChart3, ScanLine } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../stores/useAppStore";

const navItems = [
  { path: "/", label: "Upload", icon: Upload },
  { path: "/review", label: "Review", icon: ClipboardCheck },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
];

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appName, theme } = useAppStore();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
      <div
        className="flex items-center gap-2 px-5 shrink-0"
        style={{ height: 56, backgroundColor: theme.primaryColor }}
      >
        <ScanLine className="h-6 w-6 text-white" />
        <span className="text-white font-semibold text-lg tracking-tight">
          {appName}
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-[var(--color-primary)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
