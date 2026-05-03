import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Loader2, Plus, Compass, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="aspect-square overflow-hidden bg-secondary relative"
    >
      {url
        ? <img src={url} alt={item.description ?? ""} className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-muted animate-pulse" />
      }
      {item.category && (
        <span className="absolute bottom-1.5 left-1.5 bg-background/90 text-[9px] font-medium px-1.5 py-0.5 text-foreground uppercase tracking-[0.08em]">
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
    const { data } = await supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
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
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-[15px] pt-8 pb-4 flex items-end justify-between border-b border-border">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">
            cur8
          </p>
          <h1 className="text-base font-medium tracking-tight">
            Meine Pieces
            {items.length > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">{items.length}</span>
            )}
          </h1>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-8 px-3 flex items-center gap-1.5 border border-border text-foreground text-[10px] tracking-[0.08em] uppercase font-medium hover:bg-secondary transition-colors"
          style={{ borderRadius: 0 }}
        >
          <Plus className="size-3" strokeWidth={2} />
          Hinzufügen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
      </div>

      {uploading > 0 && (
        <div className="px-[15px] py-3 border-b border-border flex items-center gap-2.5">
          <Loader2 className="size-3.5 animate-spin text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            {uploading} {uploading === 1 ? "Foto wird" : "Fotos werden"} analysiert…
          </span>
        </div>
      )}

      {/* Content */}
      <div className="bg-border flex-1">
        {loading ? (
          <div className="grid grid-cols-3 gap-[1px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-secondary animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-background text-center py-16 px-6">
            <p className="text-sm font-medium tracking-tight mb-2">Dein Schrank ist leer.</p>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-[240px] mx-auto">
              Füge dein erstes Outfit hinzu — die KI taggt es automatisch.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-6 h-9 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium"
              style={{ borderRadius: 0 }}
            >
              Outfit hinzufügen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1px]">
            <AnimatePresence>
              {items.map(item => (
                <ItemThumb key={item.id} item={item} onClick={() => setSelected(item)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Item detail sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent side="bottom" className="bg-background border-t border-border rounded-none p-0">
          {selected && (
            <ItemDetail
              item={selected}
              onRemove={() => remove(selected)}
              onSimilar={() => findSimilar(selected)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ItemDetail({ item, onRemove, onSimilar }: {
  item: Item;
  onRemove: () => void;
  onSimilar: () => void;
}) {
  const url = useSignedUrl(item.image_url);
  return (
    <>
      <SheetHeader className="px-[15px] pt-5 pb-4 border-b border-border">
        <SheetTitle className="text-sm font-medium tracking-tight text-left">
          {item.description ?? item.category}
        </SheetTitle>
      </SheetHeader>

      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
        {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="px-[15px] py-4 space-y-3">
        {(item.style_tags?.length || item.colors?.length || item.season) ? (
          <div className="flex flex-wrap gap-[1px]">
            {item.style_tags?.map(t => (
              <span key={t} className="px-2.5 h-6 border border-border text-[9px] tracking-[0.08em] uppercase text-muted-foreground inline-flex items-center">
                {t}
              </span>
            ))}
            {item.colors?.map(c => (
              <span key={c} className="px-2.5 h-6 border border-border text-[9px] tracking-[0.08em] uppercase text-muted-foreground inline-flex items-center">
                {c}
              </span>
            ))}
            {item.season && (
              <span className="px-2.5 h-6 border border-border text-[9px] tracking-[0.08em] uppercase text-muted-foreground inline-flex items-center">
                {item.season}
              </span>
            )}
          </div>
        ) : null}

        <div className="flex gap-[1px] pt-1 pb-2">
          <button
            onClick={onSimilar}
            className="flex-1 h-11 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Compass className="size-3.5" strokeWidth={1.5} />
            Ähnliches finden
          </button>
          <button
            onClick={onRemove}
            className="w-11 h-11 bg-background border border-border text-destructive flex items-center justify-center hover:bg-secondary transition-colors"
            style={{ borderRadius: 0 }}
            aria-label="Entfernen"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}
