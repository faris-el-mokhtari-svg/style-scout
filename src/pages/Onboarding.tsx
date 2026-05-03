import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Upload, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<{ url: string; analyzing: boolean }[]>([]);
  const [generatingProfile, setGeneratingProfile] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const arr = Array.from(files).slice(0, 5);
    for (const file of arr) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß (max 10 MB)`);
        continue;
      }
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

  const busy = generatingProfile || uploads.some(u => u.analyzing);

  return (
    <div className="min-h-screen bg-background px-[15px] pb-12">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pt-16 pb-10"
        >
          <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-3">
            CUR8
          </p>
          <h1 className="text-2xl font-medium tracking-tight leading-tight mb-3">
            Lass uns deinen<br />Stil kennenlernen.
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
            Lade 3 Lieblings-Outfits oder Teile hoch. Die KI analysiert deinen Look und baut dein Profil auf.
          </p>
        </motion.div>

        {/* Upload area */}
        <label className="block cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            disabled={busy}
          />
          <div
            className="border border-dashed border-border group-hover:border-foreground transition-colors duration-200 p-10 text-center"
            style={{ borderRadius: 0 }}
          >
            <Upload
              className="size-6 mx-auto text-muted-foreground group-hover:text-foreground transition-colors mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium tracking-tight">Fotos auswählen</p>
            <p className="text-[10px] tracking-[0.06em] uppercase text-muted-foreground mt-1">
              JPG, PNG — max 5 Bilder, je 10 MB
            </p>
          </div>
        </label>

        {/* Uploaded previews */}
        {uploads.length > 0 && (
          <div className="grid grid-cols-3 gap-[1px] bg-border mt-[1px]">
            {uploads.map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-square overflow-hidden bg-secondary"
              >
                <img src={u.url} alt="" className="w-full h-full object-cover" />
                {u.analyzing ? (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-foreground" strokeWidth={1.5} />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-like flex items-center justify-center">
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Progress indicator */}
        {uploads.length > 0 && (
          <p className="text-[10px] tracking-[0.07em] uppercase text-muted-foreground mt-3">
            {uploads.filter(u => !u.analyzing).length} / {uploads.length} analysiert
          </p>
        )}

        {/* CTA */}
        <button
          onClick={finish}
          disabled={busy || uploads.length === 0}
          className={cn(
            "w-full h-11 bg-foreground text-background text-[10px] tracking-[0.12em] uppercase font-medium",
            "hover:bg-foreground/90 active:opacity-80 transition-colors",
            "flex items-center justify-center mt-8",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          style={{ borderRadius: 0 }}
        >
          {generatingProfile
            ? <Loader2 className="size-3.5 animate-spin" />
            : "Style-Profil erstellen"}
        </button>
      </div>
    </div>
  );
}
