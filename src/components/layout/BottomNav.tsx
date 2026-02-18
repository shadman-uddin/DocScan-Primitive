import { Upload, ClipboardCheck, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", label: "Upload", icon: Upload },
  { path: "/review", label: "Review", icon: ClipboardCheck },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              )}
              <Icon
                className="h-5 w-5 mb-0.5"
                style={{ color: isActive ? "var(--color-primary)" : "#94a3b8" }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? "var(--color-primary)" : "#94a3b8" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
