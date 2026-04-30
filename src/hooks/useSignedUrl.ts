import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Resolve a wardrobe storage path to a temporary signed URL.
export function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    if (path.startsWith("http") || path.startsWith("blob:")) { setUrl(path); return; }
    let cancelled = false;
    supabase.storage.from("wardrobe").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [path]);
  return url;
}
