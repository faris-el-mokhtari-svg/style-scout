// Aggregates wardrobe + likes into a style profile via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: items } = await supabase.from("wardrobe_items").select("category,colors,style_tags,description").eq("user_id", user.id).limit(50);
    const { data: likes } = await supabase.from("product_swipes").select("product_data").eq("user_id", user.id).in("action", ["like", "save"]).limit(50);

    if (!items?.length && !likes?.length) {
      return new Response(JSON.stringify({ error: "Lade erst ein paar Outfits hoch." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const summary = JSON.stringify({
      wardrobe: items?.map(i => ({ cat: i.category, colors: i.colors, tags: i.style_tags, desc: i.description })) ?? [],
      likes: (likes ?? []).map((l: any) => l.product_data?.title).filter(Boolean).slice(0, 30),
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist Personal Stylist. Analysiere die Daten und beschreibe den Stil der Person." },
          { role: "user", content: `Daten: ${summary}\n\nBeschreibe den Style.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "set_style_profile",
            description: "Style-Profil",
            parameters: {
              type: "object",
              properties: {
                aesthetic_labels: { type: "array", items: { type: "string" }, description: "2-4 Labels, z.B. Minimalist, Streetwear, Cottagecore, Business Casual" },
                color_palette: { type: "array", items: { type: "string" }, description: "4-6 Hex-Farben (#RRGGBB) der bevorzugten Palette" },
                description: { type: "string", description: "2-3 Sätze, locker, in du-Form, beschreibt den Stil" },
              },
              required: ["aesthetic_labels", "color_palette", "description"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "set_style_profile" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error " + resp.status);
    }

    const data = await resp.json();
    const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    await supabase.from("style_profiles").upsert({
      user_id: user.id,
      aesthetic_labels: args.aesthetic_labels,
      color_palette: args.color_palette,
      description: args.description,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-style-profile", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
