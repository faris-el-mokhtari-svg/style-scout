// Discover products: AI builds a query from style profile + filters, then Serper.dev /shopping search.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SERPER_KEY = Deno.env.get("SERPER_API_KEY");
    if (!SERPER_KEY) throw new Error("SERPER_API_KEY missing");

    const body = await req.json().catch(() => ({}));
    const { customQuery, filters } = body as { customQuery?: string; filters?: { budgetMax?: number; categories?: string[]; shops?: string[] } };

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let query = customQuery?.trim();

    if (!query) {
      // Build query from style profile
      const { data: profile } = await supabase.from("style_profiles").select("aesthetic_labels,color_palette,description").eq("user_id", user.id).maybeSingle();
      const { data: recentLikes } = await supabase.from("product_swipes").select("product_data").eq("user_id", user.id).eq("action", "like").order("created_at", { ascending: false }).limit(10);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
      const ctx = JSON.stringify({
        labels: profile?.aesthetic_labels ?? [],
        description: profile?.description ?? "",
        recentLikes: (recentLikes ?? []).map((l: any) => l.product_data?.title).filter(Boolean),
        filters,
      });

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Du bist Mode-Stylist. Generiere kurze Suchanfragen (3-6 Wörter) für Google Shopping passend zum User-Style." },
            { role: "user", content: `User-Style: ${ctx}\n\nGib EINE konkrete deutsche Suchanfrage zurück (kein 'damen' am Anfang nötig).` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "shopping_query",
              parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
            },
          }],
          tool_choice: { type: "function", function: { name: "shopping_query" } },
        }),
      });
      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        // fallback
        query = (profile?.aesthetic_labels?.[0] ?? "minimalist") + " outfit";
      } else {
        const aiData = await aiResp.json();
        query = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments).query;
      }
    }

    // Append shop filter
    if (filters?.shops?.length) query += " " + filters.shops.join(" OR ");

    const cacheKey = await sha256(JSON.stringify({ query, budgetMax: filters?.budgetMax }));

    // Cache check (24h)
    const { data: cached } = await supabase.from("product_cache").select("results,created_at").eq("query_hash", cacheKey).maybeSingle();
    if (cached && new Date(cached.created_at).getTime() > Date.now() - 24 * 3600 * 1000) {
      return new Response(JSON.stringify({ query, products: cached.results, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Serper.dev /shopping
    const serperResp = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "de", hl: "de", num: 30 }),
    });
    if (!serperResp.ok) {
      const t = await serperResp.text();
      console.error("Serper error", serperResp.status, t);
      throw new Error("Produkt-Suche fehlgeschlagen");
    }
    const serperData = await serperResp.json();

    type Product = { id: string; title: string; price: string; priceValue?: number; source: string; link: string; image: string; rating?: number };
    const products: Product[] = (serperData.shopping ?? []).map((p: any, i: number) => {
      const priceStr = p.price ?? "";
      const priceMatch = priceStr.match(/[\d.,]+/);
      const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(/\./g, "").replace(",", ".")) : undefined;
      return {
        id: `${cacheKey.slice(0, 8)}-${i}`,
        title: p.title ?? "",
        price: priceStr,
        priceValue,
        source: p.source ?? "",
        link: p.link ?? p.productLink ?? "",
        image: p.imageUrl ?? "",
        rating: p.rating,
      };
    }).filter((p: Product) => p.image && p.link && p.title);

    let filtered = products;
    if (filters?.budgetMax) filtered = filtered.filter(p => !p.priceValue || p.priceValue <= filters.budgetMax!);

    await supabase.from("product_cache").upsert({ query_hash: cacheKey, query_text: query, results: filtered, created_at: new Date().toISOString() });

    return new Response(JSON.stringify({ query, products: filtered, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("discover-products", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
