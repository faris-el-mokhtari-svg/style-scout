import { NavLink } from "react-router-dom";
import { Shirt, Sparkles, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/wardrobe", label: "Schrank", icon: Shirt },
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/likes", label: "Likes", icon: Heart },
  { to: "/profile", label: "Profil", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 rounded-2xl transition-all",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn("p-1.5 rounded-xl transition-all", isActive && "gradient-primary text-primary-foreground shadow-soft scale-110")}>
                  <Icon className="size-5" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
