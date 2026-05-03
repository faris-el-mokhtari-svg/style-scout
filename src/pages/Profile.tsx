import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, RefreshCw, LogOut, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAesthetic } from "@/context/AestheticContext";
import { AESTHETICS, type AestheticId } from "@/lib/aesthetics";

type StyleProfile = {
  aesthetic_labels: string[] | null;
  color_palette: string[] | null;
  description: string | null;
  updated_at: string;
};

type DnaPreferences = {
  silhouette: string | null;
  occasions: string[];
  era: string | null;
  formality: number;
};

const SILHOUETTES = ["Oversized", "Fitted", "Structured", "Relaxed"] as const;
const OCCASIONS   = ["Alltag", "Ausgehen", "Arbeit", "Wochenende", "Hochzeit", "Formal"] as const;
const ERAS        = ["Klassisch", "Zeitgenössisch", "Retro", "Avantgarde"] as const;

const DEFAULT_DNA: DnaPreferences = {
  silhouette: null,
  occasions: [],
  era: null,
  formality: 0.5,
};

const AESTHETIC_OPTIONS: { id: AestheticId; label: string }[] = [
  { id: 'deine-leinwand', label: 'Deine Leinwand' },
  { id: 'old-money',      label: 'Old Money' },
  { id: 'y2k',            label: 'Y2K' },
  { id: 'casual',         label: 'Casual' },
  { id: 'streetwear',     label: 'Streetwear' },
];

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { aesthetic, setAesthetic } = useAesthetic();

  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [style, setStyle]   = useState<StyleProfile | null>(null);
  const [stats, setStats]   = useState({ wardrobe: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [regen, setRegen]   = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [dna, setDna] = useState<DnaPreferences>(DEFAULT_DNA);
  const [savedDna, setSavedDna] = useState<DnaPreferences>(DEFAULT_DNA);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: sp }, { count: w }, { count: l }] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_url").eq("user_id", user.id).maybeSingle(),
      supabase.from("style_profiles").select("aesthetic_labels,color_palette,description,updated_at,dna_preferences").eq("user_id", user.id).maybeSingle(),
      supabase.from("wardrobe_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("product_swipes").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("action", ["like", "save"]),
    ]);
    setProfile(p);
    setStyle(sp as any);
    setStats({ wardrobe: w ?? 0, likes: l ?? 0 });

    if (sp?.dna_preferences) {
      const loaded = sp.dna_preferences as unknown as DnaPreferences;
      setDna(loaded);
      setSavedDna(loaded);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) load();
  }, [user, authLoading]);

  const regenerate = async () => {
    setRegen(true);
    try {
      const { error } = await supabase.functions.invoke("generate-style-profile");
      if (error) throw error;
      await load();
      toast.success("Stil-DNA aktualisiert");
    } catch (e: any) {
      toast.error(e.message ?? "Fehler");
    } finally {
      setRegen(false);
    }
  };

  const saveDna = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("style_profiles")
      .update({ dna_preferences: dna as any })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Speichern fehlgeschlagen");
      setDna(savedDna);
    } else {
      setSavedDna(dna);
      toast.success("Gespeichert");
    }
    setSaving(false);
    setEditingRow(null);
  };

  const cancelEdit = () => {
    setDna(savedDna);
    setEditingRow(null);
  };

  const handleLongPressStart = (rowId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setEditingRow(rowId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6 text-center">
        <p className="text-sm font-medium tracking-tight mb-2">Nicht eingeloggt</p>
        <p className="text-xs text-muted-foreground">Bitte einloggen, um dein Profil zu sehen.</p>
      </div>
    );
  }

  const initials = (profile?.display_name ?? user.email ?? "?")[0].toUpperCase();
  const hasStyle = !!(style?.aesthetic_labels?.length || style?.color_palette?.length);
  const isDirty = JSON.stringify(dna) !== JSON.stringify(savedDna);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Identity header */}
      <div className="px-[15px] pt-8 pb-5 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center text-foreground font-medium text-base flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium tracking-tight truncate">
              {profile?.display_name ?? "Dein Profil"}
            </h1>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="Abmelden"
          >
            <LogOut className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-border">
        <div className="grid grid-cols-2 gap-[1px]">
          <div className="bg-background px-[15px] py-5">
            <div className="text-2xl font-medium tracking-tight tabular-nums">{stats.wardrobe}</div>
            <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mt-1">Im Schrank</div>
          </div>
          <div className="bg-background px-[15px] py-5">
            <div className="text-2xl font-medium tracking-tight tabular-nums">{stats.likes}</div>
            <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mt-1">Gespeichert</div>
          </div>
        </div>
      </div>

      {/* Aesthetic switcher */}
      <div className="px-[15px] pt-6 pb-5 border-b border-border">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3">Aktive Ästhetik</p>
        <div className="flex flex-wrap gap-[1px]">
          {AESTHETIC_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setAesthetic(opt.id)}
              className={cn(
                "px-3 h-7 text-[10px] tracking-[0.08em] uppercase font-medium transition-colors border",
                aesthetic === opt.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              )}
              style={{ borderRadius: 0 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stil-DNA */}
      <div className="px-[15px] pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-0.5">Stil-DNA</p>
            <h2 className="text-sm font-medium tracking-tight">Dein Fingerabdruck</h2>
          </div>
          <button
            onClick={regenerate}
            disabled={regen}
            className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
            aria-label="Profil neu generieren"
          >
            <RefreshCw className={cn("size-3.5", regen && "animate-spin")} strokeWidth={1.5} />
          </button>
        </div>

        {!hasStyle ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-[240px] mx-auto">
              Lade mehr Outfits hoch oder like Produkte, um deine Stil-DNA aufzubauen.
            </p>
            <button
              onClick={regenerate}
              disabled={regen}
              className="px-6 h-9 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium disabled:opacity-40 flex items-center gap-2 mx-auto"
              style={{ borderRadius: 0 }}
            >
              {regen ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Profil aufbauen
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {style?.color_palette?.length ? (
              <DNARow label="Farben" rowId="colors" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
                <div className="flex gap-2 flex-wrap">
                  {style.color_palette.map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 border border-border flex-shrink-0"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </DNARow>
            ) : null}

            {style?.description ? (
              <DNARow label="Beschreibung" rowId="desc" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
                <p className="text-xs text-foreground leading-relaxed">{style.description}</p>
              </DNARow>
            ) : null}

            <DNARow label="Silhouette" rowId="silhouette" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
              <div className="flex flex-wrap gap-[1px]">
                {SILHOUETTES.map(s => (
                  <Chip
                    key={s}
                    label={s}
                    active={dna.silhouette === s}
                    editable={editingRow === 'silhouette'}
                    onToggle={() => setDna(prev => ({ ...prev, silhouette: prev.silhouette === s ? null : s }))}
                  />
                ))}
              </div>
            </DNARow>

            <DNARow label="Anlässe" rowId="occasions" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
              <div className="flex flex-wrap gap-[1px]">
                {OCCASIONS.map(o => (
                  <Chip
                    key={o}
                    label={o}
                    active={dna.occasions.includes(o)}
                    editable={editingRow === 'occasions'}
                    onToggle={() => setDna(prev => ({
                      ...prev,
                      occasions: prev.occasions.includes(o)
                        ? prev.occasions.filter(x => x !== o)
                        : [...prev.occasions, o],
                    }))}
                  />
                ))}
              </div>
            </DNARow>

            <DNARow label="Ära" rowId="era" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
              <div className="flex flex-wrap gap-[1px]">
                {ERAS.map(e => (
                  <Chip
                    key={e}
                    label={e}
                    active={dna.era === e}
                    editable={editingRow === 'era'}
                    onToggle={() => setDna(prev => ({ ...prev, era: prev.era === e ? null : e }))}
                  />
                ))}
              </div>
            </DNARow>

            <DNARow label="Formalität" rowId="formality" editingRow={editingRow} onLongPress={handleLongPressStart} onLongPressEnd={handleLongPressEnd}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-[0.05em] uppercase text-muted-foreground w-16">Entspannt</span>
                <div className="flex-1 relative h-5 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-border" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={dna.formality}
                    onChange={e => editingRow === 'formality' && setDna(prev => ({ ...prev, formality: parseFloat(e.target.value) }))}
                    disabled={editingRow !== 'formality'}
                    className="relative w-full appearance-none bg-transparent cursor-pointer disabled:cursor-default"
                    style={{ accentColor: 'var(--primary)' }}
                    aria-label="Formalitätsschieberegler"
                  />
                </div>
                <span className="text-[10px] tracking-[0.05em] uppercase text-muted-foreground w-16 text-right">Formell</span>
              </div>
            </DNARow>
          </div>
        )}

        {/* Save / cancel bar — shown when a row is being edited */}
        {editingRow && (
          <div className="flex gap-[1px] mt-6">
            <button
              onClick={cancelEdit}
              className="flex-1 h-10 border border-border text-foreground text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-secondary transition-colors"
              style={{ borderRadius: 0 }}
            >
              Abbrechen
            </button>
            <button
              onClick={saveDna}
              disabled={saving || !isDirty}
              className="flex-1 h-10 bg-foreground text-background text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              style={{ borderRadius: 0 }}
            >
              {saving
                ? <Loader2 className="size-3 animate-spin" />
                : <><Check className="size-3" strokeWidth={2.5} />Speichern</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DNARow({
  label,
  rowId,
  editingRow,
  onLongPress,
  onLongPressEnd,
  children,
}: {
  label: string;
  rowId: string;
  editingRow: string | null;
  onLongPress: (id: string) => void;
  onLongPressEnd: () => void;
  children: React.ReactNode;
}) {
  const isEditing = editingRow === rowId;
  return (
    <div
      className="space-y-2.5"
      onPointerDown={() => onLongPress(rowId)}
      onPointerUp={onLongPressEnd}
      onPointerLeave={onLongPressEnd}
    >
      <div className="flex items-center gap-2">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{label}</p>
        {!isEditing && (
          <Lock className="size-2.5 text-muted-foreground/40" strokeWidth={1.5} aria-hidden />
        )}
        {isEditing && (
          <span className="text-[10px] tracking-[0.08em] uppercase text-primary font-medium">Editierbar</span>
        )}
      </div>
      {children}
      <div className="border-b border-border" />
    </div>
  );
}

function Chip({
  label,
  active,
  editable,
  onToggle,
}: {
  label: string;
  active: boolean;
  editable: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={editable ? onToggle : undefined}
      className={cn(
        "px-3 h-7 text-[10px] tracking-[0.08em] uppercase font-medium inline-flex items-center border transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border",
        editable
          ? "cursor-pointer hover:border-foreground hover:text-foreground"
          : "cursor-default"
      )}
      style={{ borderRadius: 0 }}
    >
      {label}
    </button>
  );
}
