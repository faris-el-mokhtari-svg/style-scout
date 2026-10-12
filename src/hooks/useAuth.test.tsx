import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

let emit: (event: string, s: Session | null) => void = () => {};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: typeof emit) => {
        emit = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => new Promise(() => {}),
      signOut: async () => {},
    },
  },
}));

import { AuthProvider, useAuth } from "./useAuth";

// A fresh object each call, like Supabase re-parsing the session from storage on tab focus.
const session = (updated_at = "2026-01-01") =>
  ({ access_token: "t", user: { id: "u1", email: "a@b.c", updated_at } }) as unknown as Session;

test("tab focus re-emitting the same user does not retrigger user effects", () => {
  const runs = vi.fn();
  const Probe = () => {
    const { user } = useAuth();
    useEffect(() => runs(user?.id ?? null), [user]);
    return null;
  };
  render(<AuthProvider><Probe /></AuthProvider>);
  runs.mockClear();

  act(() => emit("SIGNED_IN", session()));
  expect(runs).toHaveBeenCalledTimes(1);

  act(() => emit("SIGNED_IN", session()));
  act(() => emit("TOKEN_REFRESHED", session()));
  expect(runs).toHaveBeenCalledTimes(1);

  act(() => emit("USER_UPDATED", session("2026-02-01")));
  expect(runs).toHaveBeenCalledTimes(2);

  act(() => emit("SIGNED_OUT", null));
  expect(runs).toHaveBeenLastCalledWith(null);
});
