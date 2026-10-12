import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase re-emits SIGNED_IN with a fresh session object every time the tab regains focus
    // (and on each token refresh). Keep the previous user unless it really changed, otherwise
    // every effect keyed on `user` refetches and wipes page state.
    const sync = (s: Session | null) => {
      const next = s?.user ?? null;
      setUser(prev => (prev?.id === next?.id && prev?.updated_at === next?.updated_at ? prev : next));
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => sync(s));
    supabase.auth.getSession().then(({ data }) => sync(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
