import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Bookmark, RefreshCw, SlidersHorizontal, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

type Product = {
  id: string;
  title: string;
  price: string;
  priceValue?: number;
  source: string;
  link: string;
  image: string;
};

const SHOP_OPTIONS = ["Zara", "H&M", "ASOS", "Vinted", "Zalando", "About You", "Bershka"];

export default function Discover() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(150);
  const [shops, setShops] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");

  const fetchProducts = async (customQuery?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-products", {
        body: { customQuery, filters: { budgetMax: budget, shops } },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCurrentQuery(data.query);
      // filter out already swiped
      const { data: swiped } = await supabase.from("product_swipes").select("product_id").eq("user_id", user.id);
      const swipedSet = new Set((swiped ?? []).map((s: any) => s.product_id));
      setProducts((data.products as Product[]).filter(p => !swipedSet.has(p.id)));
    } catch (e: any) {
      toast.error(e.message ?? "Suche fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get("q") ?? undefined;
    fetchProducts(q);
    if (q) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const swipe = async (product: Product, action: "like" | "dislike" | "save") => {
    if (!user) return;
    setProducts(prev => prev.filter(p => p.id !== product.id));
    await supabase.from("product_swipes").upsert({
      user_id: user.id,
      product_id: product.id,
      product_data: product as any,
      action,
    });
    if (action === "like") toast.success("❤️ Gespeichert in deinen Likes");
    if (action === "save") toast.success("🔖 In Wunschliste");
  };

  return (
    <div className="px-5 pt-8 min-h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black">Discover</h1>
          {currentQuery && <p className="text-xs text-muted-foreground mt-1">"{currentQuery}"</p>}
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-2xl"><SlidersHorizontal className="size-4" /></Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Filter</SheetTitle></SheetHeader>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between mb-2"><span className="font-bold">Budget</span><span>bis {budget} €</span></div>
                  <Slider value={[budget]} onValueChange={v => setBudget(v[0])} min={20} max={500} step={10} />
                </div>
                <div>
                  <div className="font-bold mb-2">Shops</div>
                  <div className="flex flex-wrap gap-2">
                    {SHOP_OPTIONS.map(s => (
                      <Badge
                        key={s}
                        onClick={() => setShops(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`cursor-pointer rounded-full px-3 py-1 ${shops.includes(s) ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
                      >{s}</Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={() => fetchProducts()} className="w-full rounded-2xl gradient-primary text-primary-foreground font-bold h-12">Anwenden</Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => fetchProducts()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-6">
        {loading && products.length === 0 ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : products.length === 0 ? (
          <EmptyState onRefresh={() => fetchProducts()} />
        ) : (
          <div className="relative w-full aspect-[3/4] max-w-sm">
            <AnimatePresence>
              {products.slice(0, 3).reverse().map((p, idx, arr) => {
                const isTop = idx === arr.length - 1;
                return (
                  <SwipeCard
                    key={p.id}
                    product={p}
                    isTop={isTop}
                    offset={(arr.length - 1 - idx) * 8}
                    onSwipe={(a) => swipe(p, a)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="flex justify-center gap-4 pb-2">
          <ActionButton color="dislike" onClick={() => products[0] && swipe(products[0], "dislike")}>
            <X className="size-7" strokeWidth={3} />
          </ActionButton>
          <ActionButton color="save" onClick={() => products[0] && swipe(products[0], "save")}>
            <Bookmark className="size-6" strokeWidth={2.5} />
          </ActionButton>
          <ActionButton color="like" onClick={() => products[0] && swipe(products[0], "like")}>
            <Heart className="size-7 fill-current" strokeWidth={2.5} />
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function ActionButton({ color, onClick, children }: { color: "like" | "dislike" | "save"; onClick: () => void; children: React.ReactNode }) {
  const cls = color === "like" ? "bg-like" : color === "dislike" ? "bg-dislike" : "bg-save";
  return (
    <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} onClick={onClick}
      className={`${cls} text-white size-14 rounded-full flex items-center justify-center shadow-card`}>
      {children}
    </motion.button>
  );
}

function SwipeCard({ product, isTop, offset, onSwipe }: { product: Product; isTop: boolean; offset: number; onSwipe: (a: "like" | "dislike" | "save") => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const saveOpacity = useTransform(y, [-100, -20], [1, 0]);

  return (
    <motion.div
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{ x, y, rotate, top: offset, scale: 1 - offset / 100 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe("like");
        else if (info.offset.x < -120) onSwipe("dislike");
        else if (info.offset.y < -120) onSwipe("save");
      }}
      animate={{ scale: 1 - offset / 100 }}
      exit={{ x: x.get() > 0 ? 400 : x.get() < 0 ? -400 : 0, y: y.get() < 0 ? -400 : 0, opacity: 0, transition: { duration: 0.25 } }}
      className="absolute inset-0 bg-card rounded-3xl shadow-card overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 px-4 py-2 rounded-2xl border-4 border-like text-like font-black text-2xl rotate-[-15deg]">LIKE</motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 right-6 px-4 py-2 rounded-2xl border-4 border-dislike text-dislike font-black text-2xl rotate-[15deg]">NOPE</motion.div>
        <motion.div style={{ opacity: saveOpacity }} className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl border-4 border-save text-save font-black text-2xl">SAVE</motion.div>

        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
          <div className="text-xs uppercase font-bold opacity-80 mb-1">{product.source}</div>
          <h3 className="font-bold text-lg leading-tight line-clamp-2">{product.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black">{product.price}</span>
            <a href={product.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
               className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              Shop <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="text-center py-12 px-6 rounded-3xl bg-card shadow-soft">
      <Sparkles className="size-10 text-primary mx-auto mb-3" />
      <p className="font-bold">Keine neuen Vorschläge</p>
      <p className="text-sm text-muted-foreground mb-4">Tippe Refresh für frische Ideen.</p>
      <Button onClick={onRefresh} className="rounded-2xl gradient-primary text-primary-foreground font-bold">
        <RefreshCw className="size-4 mr-1" /> Neue Vorschläge
      </Button>
    </div>
  );
}
