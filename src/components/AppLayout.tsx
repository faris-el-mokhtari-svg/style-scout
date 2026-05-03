import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();

  // Auth bypassed for preview

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-md mx-auto">{children ?? <Outlet />}</main>
      <BottomNav />
    </div>
  );
}
