import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Heart, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Swipe = {
  id: string;
  product_id: string;
  action: "like" | "dislike" | "save";
  product_data: { title: string; price: string; source: string; link: string; image: string };
  created_at: string;
};

export default function Likes() {
  const { user } = useAuth();
  const [items, setItems] = useState<Swipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "like" | "save">("all");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("product_swipes").select("*").eq("user_id", user.id).in("action", ["like", "save"]).order("created_at", { ascending: false });
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
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black">Wunschliste</h1>
          <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "Stück" : "Stücke"}</p>
        </div>
        <Heart className="size-7 text-primary fill-primary" />
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as any)} className="mb-4">
        <TabsList className="grid grid-cols-3 rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl">Alle</TabsTrigger>
          <TabsTrigger value="like" className="rounded-xl">❤️ Likes</TabsTrigger>
          <TabsTrigger value="save" className="rounded-xl">🔖 Saved</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl bg-card shadow-soft">
          <Heart className="size-10 text-primary mx-auto mb-3" />
          <p className="font-bold">Noch nichts gespeichert</p>
          <p className="text-sm text-muted-foreground">Swipe in Discover nach rechts oder oben.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(s => (
              <motion.div
                key={s.id}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-card rounded-2xl overflow-hidden shadow-soft"
              >
                <div className="aspect-square bg-muted relative">
                  <img src={s.product_data.image} alt={s.product_data.title} className="w-full h-full object-cover" />
                  <button onClick={() => remove(s.id)} className="absolute top-2 right-2 bg-card/90 backdrop-blur rounded-full p-1.5 shadow-soft">
                    <Trash2 className="size-3.5 text-destructive" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">{s.product_data.source}</div>
                  <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1">{s.product_data.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{s.product_data.price}</span>
                    <a href={s.product_data.link} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" className="size-7 rounded-full gradient-primary text-primary-foreground"><ExternalLink className="size-3" /></Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
