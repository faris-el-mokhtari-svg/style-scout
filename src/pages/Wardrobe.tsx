import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Item = {
  id: string;
  image_url: string;
  category: string | null;
  colors: string[] | null;
  style_tags: string[] | null;
  description: string | null;
  season: string | null;
};

function ItemThumb({ item, onClick }: { item: Item; onClick: () => void }) {
  const url = useSignedUrl(item.image_url);
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="aspect-square rounded-2xl overflow-hidden bg-muted relative shadow-soft"
    >
      {url ? <img src={url} alt={item.description ?? ""} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted animate-pulse" />}
      {item.category && (
        <span className="absolute bottom-2 left-2 bg-card/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full">
          {item.category}
        </span>
      )}
    </motion.button>
  );
}

export default function Wardrobe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [selected, setSelected] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("wardrobe_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(files.length);
    for (const file of Array.from(files)) {
      try {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("wardrobe").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(path, 3600);
        const { data: tags, error: aiErr } = await supabase.functions.invoke("analyze-clothing-image", { body: { imageUrl: signed?.signedUrl } });
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
      } catch (e: any) {
        toast.error(e.message ?? "Upload fehlgeschlagen");
      } finally {
        setUploading(c => c - 1);
      }
    }
    load();
  };

  const remove = async (item: Item) => {
    await supabase.from("wardrobe_items").delete().eq("id", item.id);
    if (item.image_url && !item.image_url.startsWith("http")) {
      await supabase.storage.from("wardrobe").remove([item.image_url]);
    }
    setSelected(null);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const findSimilar = (item: Item) => {
    setSelected(null);
    navigate(`/discover?q=${encodeURIComponent(item.description ?? item.category ?? "")}`);
  };

  return (
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Mein Schrank</h1>
          <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "Stück" : "Stücke"}</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} className="rounded-2xl gradient-primary text-primary-foreground font-bold shadow-soft">
          <Plus className="size-4 mr-1" /> Hinzufügen
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
      </div>

      {uploading > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-primary/10 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>{uploading} {uploading === 1 ? "Foto wird" : "Fotos werden"} analysiert…</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl bg-card shadow-soft">
          <Sparkles className="size-10 text-primary mx-auto mb-3" />
          <p className="font-bold mb-1">Dein Schrank ist leer</p>
          <p className="text-sm text-muted-foreground mb-4">Lade dein erstes Outfit hoch — die KI taggt es automatisch.</p>
          <Button onClick={() => fileRef.current?.click()} className="rounded-2xl gradient-primary text-primary-foreground font-bold">
            <Plus className="size-4 mr-1" /> Foto hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {items.map(item => <ItemThumb key={item.id} item={item} onClick={() => setSelected(item)} />)}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          {selected && <ItemDetail item={selected} onRemove={() => remove(selected)} onSimilar={() => findSimilar(selected)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemDetail({ item, onRemove, onSimilar }: { item: Item; onRemove: () => void; onSimilar: () => void }) {
  const url = useSignedUrl(item.image_url);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left">{item.description ?? item.category}</DialogTitle>
      </DialogHeader>
      <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
        {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {item.style_tags?.map(t => <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>)}
        </div>
        <div className="flex flex-wrap gap-1">
          {item.colors?.map(c => <Badge key={c} variant="outline" className="rounded-full">{c}</Badge>)}
          {item.season && <Badge variant="outline" className="rounded-full">{item.season}</Badge>}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onSimilar} className="flex-1 rounded-2xl gradient-primary text-primary-foreground font-bold">
          <Sparkles className="size-4 mr-1" /> Ähnliches finden
        </Button>
        <Button onClick={onRemove} variant="outline" size="icon" className="rounded-2xl">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </>
  );
}
