import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Routes new users to /onboarding, returning users to /discover.
export default function Index() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setOnboarded(data?.onboarding_completed ?? false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center gradient-soft"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (onboarded === null) return <div className="min-h-screen flex items-center justify-center gradient-soft"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  return <Navigate to={onboarded ? "/discover" : "/onboarding"} replace />;
}
