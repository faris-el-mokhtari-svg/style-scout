import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Swipe = {
  id: string;
  product_id: string;
  action: "like" | "dislike" | "save";
  product_data: { title: string; price: string; source: string; link: string; image: string };
  created_at: string;
};

const filters = [
  { value: "all",  label: "Alle" },
  { value: "like", label: "Likes" },
  { value: "save", label: "Gespeichert" },
] as const;

export default function Likes() {
  const { user } = useAuth();
  const [items, setItems] = useState<Swipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "like" | "save">("all");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("product_swipes")
      .select("*")
      .eq("user_id", user.id)
      .in("action", ["like", "save"])
      .order("created_at", { ascending: false });
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("product_swipes").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Entfernt");
  };

  const filtered = filter === "all" ? items : items.filter(i => i.action === filter);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-[15px] pt-8 pb-4 flex items-end justify-between border-b border-border">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">
            cur8
          </p>
          <h1 className="text-base font-medium tracking-tight">
            Gespeichert
            {items.length > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">{items.length}</span>
            )}
          </h1>
        </div>
        <Heart className="size-4 text-muted-foreground mb-0.5" strokeWidth={1.5} />
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border">
        <div className="flex px-[15px]">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 h-9 text-[10px] tracking-[0.1em] uppercase font-medium transition-colors border-b-[1.5px] -mb-[1px]",
                filter === f.value
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-border flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-[1px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-background">
                <div className="aspect-[3/4] bg-secondary animate-pulse" />
                <div className="p-[10px] space-y-1.5">
                  <div className="h-2 w-14 bg-secondary animate-pulse" />
                  <div className="h-2.5 w-full bg-secondary animate-pulse" />
                  <div className="h-2 w-10 bg-secondary animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-background text-center py-16 px-6">
            <p className="text-sm font-medium tracking-tight mb-2">
              {items.length === 0 ? "Noch nichts gespeichert." : "Keine Stücke hier."}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
              {items.length === 0
                ? "Like oder speichere Produkte in Entdecken."
                : "Versuch einen anderen Filter."}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-5 text-xs tracking-[0.1em] uppercase font-medium border-b border-foreground pb-0.5"
              >
                Alle anzeigen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[1px]">
            <AnimatePresence>
              {filtered.map(s => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col bg-background group"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                    <img
                      src={s.product_data.image}
                      alt={s.product_data.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Action dot */}
                    <span className={cn(
                      "absolute top-2 left-2 w-1.5 h-1.5",
                      s.action === "like" ? "bg-like" : "bg-save"
                    )} />
                    {/* Remove */}
                    <button
                      onClick={() => remove(s.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Entfernen"
                    >
                      <Trash2 className="size-3 text-destructive" strokeWidth={1.5} />
                    </button>
                    {/* Shop link */}
                    <a
                      href={s.product_data.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Im Shop ansehen"
                    >
                      <ExternalLink className="size-3 text-foreground/60" strokeWidth={1.5} />
                    </a>
                  </div>

                  {/* Meta */}
                  <div className="p-[10px] pb-[15px] space-y-[3px]">
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase leading-none text-foreground">
                      {s.product_data.source}
                    </p>
                    <p className="text-[11px] font-normal leading-tight tracking-[0.02em] text-foreground line-clamp-2">
                      {s.product_data.title}
                    </p>
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground leading-none">
                      {s.product_data.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
