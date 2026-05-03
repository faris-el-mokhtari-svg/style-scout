import { Users, UserPlus } from "lucide-react";

export default function Friends() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-[15px] pt-8 pb-4 border-b border-border">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">
          cur8
        </p>
        <h1 className="text-base font-medium tracking-tight">Dein Kreis</h1>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 border border-border flex items-center justify-center mb-6">
          <Users className="size-5 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <p className="text-sm font-medium tracking-tight mb-2">Entdecke andere Stile.</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mb-7">
          Finde Personen, deren Geschmack dich inspiriert — sieh ihre Outfits, tausch Pieces aus und bau deinen eigenen Kreis auf.
        </p>

        <button
          className="h-9 px-6 bg-foreground text-background text-xs tracking-[0.1em] uppercase font-medium flex items-center gap-2 hover:bg-foreground/90 transition-colors"
          style={{ borderRadius: 0 }}
        >
          <UserPlus className="size-3.5" strokeWidth={1.5} />
          Personen finden
        </button>
      </div>

      {/* Coming soon */}
      <div className="px-[15px] py-5 border-t border-border">
        <p className="text-[10px] tracking-[0.05em] uppercase text-muted-foreground text-center">
          Aktivitäts-Feed und gegenseitige Likes folgen bald.
        </p>
      </div>
    </div>
  );
}
