import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "./BottomNav";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen gradient-soft pb-24">
      <main className="max-w-md mx-auto">{children ?? <Outlet />}</main>
      <BottomNav />
    </div>
  );
}
