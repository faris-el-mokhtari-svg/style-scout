import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<{ url: string; analyzing: boolean }[]>([]);
  const [generatingProfile, setGeneratingProfile] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const arr = Array.from(files).slice(0, 5);
    for (const file of arr) {
      const idx = uploads.length;
      setUploads(prev => [...prev, { url: URL.createObjectURL(file), analyzing: true }]);
      try {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(path, 60 * 60 * 24 * 365);
        const imageUrl = signed?.signedUrl;
        if (!imageUrl) throw new Error("URL fehlt");

        const { data: tags, error: aiErr } = await supabase.functions.invoke("analyze-clothing-image", { body: { imageUrl } });
        if (aiErr) throw aiErr;
        if ((tags as any)?.error) throw new Error((tags as any).error);

        await supabase.from("wardrobe_items").insert({
          user_id: user.id,
          image_url: path,
          category: tags.category,
          colors: tags.colors,
          style_tags: tags.style_tags,
          description: tags.description,
          season: tags.season,
          analyzed: true,
        });
        setUploads(prev => prev.map((u, i) => i === idx ? { ...u, analyzing: false } : u));
      } catch (e: any) {
        toast.error("Upload fehlgeschlagen: " + (e.message ?? e));
        setUploads(prev => prev.filter((_, i) => i !== idx));
      }
    }
  };

  const finish = async () => {
    if (uploads.length < 1) {
      toast.error("Lade mindestens ein Outfit hoch");
      return;
    }
    setGeneratingProfile(true);
    try {
      const { error } = await supabase.functions.invoke("generate-style-profile");
      if (error) throw error;
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("user_id", user!.id);
      navigate("/discover");
    } catch (e: any) {
      toast.error(e.message ?? "Style-Profil konnte nicht erstellt werden");
    } finally {
      setGeneratingProfile(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh p-6 pb-12">
      <div className="max-w-md mx-auto pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex p-3 rounded-2xl gradient-primary shadow-soft mb-4">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black mb-2">Lass uns deinen Style kennenlernen</h1>
          <p className="text-muted-foreground mb-6">Lade 3 Lieblings-Outfits oder Teile hoch. Unsere KI analysiert deinen Look.</p>
        </motion.div>

        <label className="block">
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          <div className="border-2 border-dashed border-primary/40 rounded-3xl p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors">
            <Upload className="size-10 mx-auto text-primary mb-2" />
            <p className="font-bold">Fotos auswählen</p>
            <p className="text-xs text-muted-foreground">JPG, PNG · max 5</p>
          </div>
        </label>

        {uploads.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            {uploads.map((u, i) => (
              <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <img src={u.url} alt="" className="w-full h-full object-cover" />
                {u.analyzing ? (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 bg-like text-white rounded-full p-1">
                    <Check className="size-3" strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <Button
          onClick={finish}
          disabled={generatingProfile || uploads.some(u => u.analyzing) || uploads.length === 0}
          className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base mt-8 shadow-soft"
        >
          {generatingProfile ? <Loader2 className="size-5 animate-spin" /> : "Style-Profil erstellen ✨"}
        </Button>
      </div>
    </div>
  );
}
