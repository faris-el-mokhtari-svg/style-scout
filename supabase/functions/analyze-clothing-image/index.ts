// Analyze a clothing image with Lovable AI (Gemini Vision) and return structured tags.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein Mode-Experte. Analysiere Kleidungsstücke präzise und kompakt." },
          {
            role: "user",
            content: [
              { type: "text", text: "Analysiere dieses Kleidungsstück. Falls mehrere Stücke zu sehen sind, beschreibe das auffälligste." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "tag_clothing",
            description: "Strukturierte Mode-Tags",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", description: "z.B. Oberteil, Hose, Kleid, Schuhe, Jacke, Accessoire" },
                colors: { type: "array", items: { type: "string" }, description: "1-3 Hauptfarben auf Deutsch" },
                style_tags: { type: "array", items: { type: "string" }, description: "3-6 Style-Tags z.B. minimalistisch, oversized, streetwear, business" },
                description: { type: "string", description: "Ein Satz, der das Stück treffend beschreibt (z.B. 'Oversized beiges Leinenhemd')" },
                season: { type: "string", description: "Frühling/Sommer/Herbst/Winter/Ganzjahr" },
              },
              required: ["category", "colors", "style_tags", "description", "season"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "tag_clothing" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen, kurz warten." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : null;
    if (!parsed) throw new Error("No tags returned");

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-clothing-image", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
