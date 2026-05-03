import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight, Heart, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  title: string;
  price: string;
  priceValue?: number;
  source: string;
  link: string;
  image: string;
  images?: string[];
  sizes?: string[];
  category?: string;
};

const SHOP_OPTIONS = ["Zara", "H&M", "ASOS", "Vinted", "Zalando", "About You", "Bershka"];

const CATEGORIES = [
  { value: "all",         label: "Alles" },
  { value: "shirts",      label: "Shirts" },
  { value: "hosen",       label: "Hosen" },
  { value: "schuhe",      label: "Schuhe" },
  { value: "jacken",      label: "Jacken" },
  { value: "kleider",     label: "Kleider" },
  { value: "accessoires", label: "Accessoires" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

function matchesCategory(product: Product, cat: Category): boolean {
  if (cat === "all") return true;
  const haystack = `${product.title} ${product.category ?? ""}`.toLowerCase();
  const map: Record<Exclude<Category, "all">, string[]> = {
    shirts:      ["shirt", "t-shirt", "top", "bluse", "blouse", "polo"],
    hosen:       ["hose", "pant", "jeans", "chino", "short", "legging"],
    schuhe:      ["shoe", "schuh", "sneaker", "boot", "stiefel", "loafer", "sandal"],
    jacken:      ["jacke", "jacket", "coat", "mantel", "blazer", "hoodie", "sweat"],
    kleider:     ["kleid", "dress", "rock", "skirt"],
    accessoires: ["tasche", "bag", "schal", "cap", "hat", "belt", "gürtel", "jewelry", "schmuck"],
  };
  return map[cat as Exclude<Category, "all">]?.some(kw => haystack.includes(kw)) ?? false;
}

function ProductTile({
  product,
  liked,
  saved,
  onLike,
  onSave,
}: {
  product: Product;
  liked: boolean;
  saved: boolean;
  onLike: (e: React.MouseEvent) => void;
  onSave: (e: React.MouseEvent) => void;
}) {
  const images = product.images?.length ? product.images : [product.image];
  const [imgIndex, setImgIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setImgIndex(i => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setImgIndex(i => (i + 1) % images.length);
  };

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => setHovered(true), 80);
  };
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHovered(false);
  };

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image tile */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '3/4', backgroundColor: '#f0f0f0' }}
      >
        <img
          src={images[imgIndex]}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
          loading="lazy"
          draggable={false}
        />

        {/* Like button — top right, always visible */}
        <button
          onClick={onLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={cn(
            "absolute top-1.5 right-1.5 z-20 w-6 h-6 flex items-center justify-center transition-transform duration-100 active:scale-90",
          )}
        >
          <Heart
            className={cn(
              "size-[13px] drop-shadow-sm transition-colors duration-150",
              liked ? "text-like fill-current" : "text-white fill-white/30"
            )}
            strokeWidth={liked ? 0 : 1.5}
          />
        </button>

        {/* Image nav arrows — on hover, multiple images */}
        {hovered && images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 inset-y-0 w-8 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft className="size-4 text-white drop-shadow" strokeWidth={2} />
            </button>
            <button
              onClick={next}
              className="absolute right-0 inset-y-0 w-8 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Nächstes Bild"
            >
              <ChevronRight className="size-4 text-white drop-shadow" strokeWidth={2} />
            </button>

            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block rounded-full transition-all duration-150",
                    i === imgIndex ? "w-3 h-1 bg-white" : "w-1 h-1 bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Sizes overlay — on hover */}
        {hovered && product.sizes?.length ? (
          <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 z-10">
            <p className="text-[9px] tracking-[0.06em] text-neutral-500 leading-none">
              {product.sizes.join("  ·  ")}
            </p>
          </div>
        ) : null}
      </div>

      {/* Meta */}
      <div className="pt-[6px] pb-[10px] px-[2px]">
        <p className="text-[9px] font-bold tracking-[0.1em] uppercase leading-none text-foreground truncate">
          {product.source}
        </p>
        <p className="text-[10px] font-normal leading-snug tracking-[0.01em] text-foreground mt-[3px] line-clamp-2">
          {product.title}
        </p>
        <div className="flex items-center justify-between mt-[3px]">
          <p className="text-[9px] tracking-[0.05em] text-muted-foreground leading-none">
            {product.price}
          </p>
          <button
            onClick={onSave}
            aria-label={saved ? "Unsave" : "Speichern"}
            className="w-5 h-5 flex items-center justify-center -mr-0.5 active:scale-90 transition-transform duration-100"
          >
            <Bookmark
              className={cn(
                "size-[11px] transition-colors duration-150",
                saved ? "text-save fill-current" : "text-muted-foreground/50"
              )}
              strokeWidth={saved ? 0 : 1.5}
            />
          </button>
        </div>
      </div>
    </a>
  );
}

function SkeletonTile() {
  return (
    <div className="flex flex-col">
      <div
        className="w-full animate-pulse"
        style={{ aspectRatio: '3/4', backgroundColor: '#e8e8e8' }}
      />
      <div className="pt-[6px] pb-[10px] px-[2px] space-y-[4px]">
        <div className="h-[9px] w-10 bg-secondary animate-pulse rounded-none" />
        <div className="h-[10px] w-full bg-secondary animate-pulse rounded-none" />
        <div className="h-[9px] w-8 bg-secondary animate-pulse rounded-none" />
      </div>
    </div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(150);
  const [shops, setShops] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const hydrateSwipes = async (productIds: string[]) => {
    if (!user || productIds.length === 0) return;
    const { data } = await supabase
      .from("product_swipes")
      .select("product_id, action")
      .eq("user_id", user.id)
      .in("product_id", productIds)
      .in("action", ["like", "save"]);
    if (!data) return;
    setLikedIds(new Set(data.filter(r => r.action === "like").map(r => r.product_id)));
    setSavedIds(new Set(data.filter(r => r.action === "save").map(r => r.product_id)));
  };

  const fetchProducts = async (customQuery?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-products", {
        body: { customQuery, filters: { budgetMax: budget, shops } },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const fetched = data.products as Product[];
      setProducts(fetched);
      hydrateSwipes(fetched.map(p => p.id));
    } catch (e: any) {
      toast.error(e.message ?? "Suche fehlgeschlagen");
      setProducts([]);
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

  const toggleAction = async (product: Product, action: "like" | "save", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Bitte einloggen");
      return;
    }

    const ids = action === "like" ? likedIds : savedIds;
    const setIds = action === "like" ? setLikedIds : setSavedIds;
    const isActive = ids.has(product.id);

    // Optimistic update
    setIds(prev => {
      const next = new Set(prev);
      isActive ? next.delete(product.id) : next.add(product.id);
      return next;
    });

    if (isActive) {
      const { error } = await supabase
        .from("product_swipes")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .eq("action", action);
      if (error) {
        setIds(prev => new Set([...prev, product.id]));
        toast.error("Fehler beim Entfernen");
      }
    } else {
      const { error } = await supabase.from("product_swipes").insert({
        user_id: user.id,
        product_id: product.id,
        action,
        product_data: {
          title: product.title,
          price: product.price,
          source: product.source,
          link: product.link,
          image: product.image,
        },
      });
      if (error) {
        setIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
        toast.error("Fehler beim Speichern");
      }
    }
  };

  const filtered = products.filter(p => matchesCategory(p, category));

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-[15px] pt-8 pb-4 flex items-end justify-between border-b border-border">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">cur8</p>
          <h1 className="text-base font-medium tracking-tight">Kuratiert für dich</h1>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="w-8 h-8 flex items-center justify-center border border-border text-foreground hover:bg-secondary transition-colors"
                aria-label="Filter"
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border rounded-none">
              <SheetHeader className="border-b border-border pb-3 mb-5">
                <SheetTitle className="text-sm font-medium tracking-tight text-left">Filter</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 pb-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-medium tracking-[0.05em] uppercase">Budget</span>
                    <span className="text-xs text-muted-foreground">bis {budget} €</span>
                  </div>
                  <Slider value={[budget]} onValueChange={v => setBudget(v[0])} min={20} max={500} step={10} />
                </div>
                <div>
                  <div className="text-xs font-medium tracking-[0.05em] uppercase mb-3">Shops</div>
                  <div className="flex flex-wrap gap-[1px]">
                    {SHOP_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setShops(prev =>
                          prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                        )}
                        className={cn(
                          "px-3 h-7 text-[10px] tracking-[0.08em] uppercase font-medium transition-colors border",
                          shops.includes(s)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => fetchProducts()}
                  className="w-full h-11 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium hover:bg-foreground/90 transition-colors"
                >
                  Anwenden
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto no-scrollbar px-[15px]">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "flex-shrink-0 px-4 h-9 text-[10px] tracking-[0.1em] uppercase font-medium transition-colors border-b-[1.5px] -mb-[1px]",
                category === cat.value
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-[1px] bg-border p-[1px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-background">
              <SkeletonTile />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-background text-center py-16 px-6">
          <p className="text-sm font-medium tracking-tight mb-2">
            {products.length === 0 ? "Dein Stil wartet." : "Keine Pieces in dieser Kategorie."}
          </p>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            {products.length === 0
              ? "Lade Outfits hoch, um loszulegen."
              : "Versuch eine andere Kategorie."}
          </p>
          {category !== "all" ? (
            <button
              onClick={() => setCategory("all")}
              className="text-xs tracking-[0.1em] uppercase font-medium border-b border-foreground pb-0.5"
            >
              Alle anzeigen
            </button>
          ) : (
            <button
              onClick={() => fetchProducts()}
              className="px-6 h-9 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium"
              style={{ borderRadius: 0 }}
            >
              Neu laden
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-[1px] bg-border p-[1px]">
          {filtered.map(product => (
            <div key={product.id} className="bg-background">
              <ProductTile
                product={product}
                liked={likedIds.has(product.id)}
                saved={savedIds.has(product.id)}
                onLike={e => toggleAction(product, "like", e)}
                onSave={e => toggleAction(product, "save", e)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
