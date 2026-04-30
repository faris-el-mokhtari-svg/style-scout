import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

type StyleProfile = {
  aesthetic_labels: string[] | null;
  color_palette: string[] | null;
  description: string | null;
  updated_at: string;
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [style, setStyle] = useState<StyleProfile | null>(null);
  const [stats, setStats] = useState({ wardrobe: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [regen, setRegen] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: sp }, { count: w }, { count: l }] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_url").eq("user_id", user.id).maybeSingle(),
      supabase.from("style_profiles").select("aesthetic_labels,color_palette,description,updated_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("wardrobe_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("product_swipes").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("action", ["like", "save"]),
    ]);
    setProfile(p);
    setStyle(sp as any);
    setStats({ wardrobe: w ?? 0, likes: l ?? 0 });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const regenerate = async () => {
    setRegen(true);
    try {
      const { error } = await supabase.functions.invoke("generate-style-profile");
      if (error) throw error;
      await load();
      toast.success("Style-Profil aktualisiert ✨");
    } catch (e: any) {
      toast.error(e.message ?? "Fehler");
    } finally {
      setRegen(false);
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="px-5 pt-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-black text-2xl">
          {(profile?.display_name ?? user?.email ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{profile?.display_name ?? "Du"}</h1>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-2xl" onClick={signOut}>
          <LogOut className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-soft">
          <div className="text-3xl font-black text-gradient">{stats.wardrobe}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase">Im Schrank</div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-soft">
          <div className="text-3xl font-black text-gradient">{stats.likes}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase">Likes</div>
        </div>
      </div>

      <div className="bg-card rounded-3xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Dein Style</h2>
          <Button variant="ghost" size="sm" onClick={regenerate} disabled={regen} className="rounded-xl">
            <RefreshCw className={`size-4 ${regen ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {style?.aesthetic_labels?.length ? (
          <>
            <div className="flex flex-wrap gap-2">
              {style.aesthetic_labels.map(l => (
                <Badge key={l} className="rounded-full px-3 py-1 gradient-primary text-primary-foreground font-bold">{l}</Badge>
              ))}
            </div>
            {style.description && <p className="text-sm leading-relaxed">{style.description}</p>}
            {style.color_palette?.length ? (
              <div>
                <div className="text-xs uppercase font-bold text-muted-foreground mb-2">Deine Palette</div>
                <div className="flex gap-2">
                  {style.color_palette.map((c, i) => (
                    <div key={i} className="size-10 rounded-2xl shadow-soft border" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Noch kein Style-Profil. Lade mehr Outfits hoch oder like Produkte.</p>
            <Button onClick={regenerate} disabled={regen} className="rounded-2xl gradient-primary text-primary-foreground font-bold">
              {regen ? <Loader2 className="size-4 animate-spin" /> : "Profil generieren"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
