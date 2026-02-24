import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import OfflineBanner from "./OfflineBanner";
import { ToastContainer } from "../ui/ToastContainer";

export default function AppShell() {
  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <OfflineBanner />
      <div className="lg:hidden">
        <TopBar />
      </div>
      <SideNav />

      <main className="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-60 min-h-screen">
        <div className="lg:py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />
      <ToastContainer />
    </div>
  );
}
