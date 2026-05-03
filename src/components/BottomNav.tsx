import { NavLink } from "react-router-dom";
import { Shirt, Compass, Heart, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAesthetic } from "@/context/AestheticContext";

const items = [
  { to: "/wardrobe",  label: "Schrank",   icon: Shirt },
  { to: "/discover",  label: "Entdecken", icon: Compass },
  { to: "/likes",     label: "Likes",     icon: Heart },
  { to: "/friends",   label: "Freunde",   icon: Users },
  { to: "/profile",   label: "Profil",    icon: User },
];

export default function BottomNav() {
  const { config } = useAesthetic();
  const indicator = config.bottomNavIndicator;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-1.5 py-3 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background — pill or fill style */}
                {isActive && indicator === 'pill' && (
                  <span
                    className="absolute inset-x-2 inset-y-1.5"
                    style={{
                      backgroundColor: 'var(--secondary)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  />
                )}
                {isActive && indicator === 'fill' && (
                  <span
                    className="absolute inset-x-1 inset-y-1"
                    style={{
                      backgroundColor: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                )}

                <Icon
                  className={cn(
                    "relative size-[18px] z-10",
                    isActive && indicator === 'fill' ? "text-primary-foreground" : ""
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className={cn(
                    "relative z-10 text-[9px] tracking-[0.1em] uppercase leading-none",
                    isActive ? "font-medium" : "font-normal",
                    isActive && indicator === 'fill' ? "text-primary-foreground" : ""
                  )}
                >
                  {label}
                </span>

                {/* Underline indicator */}
                {isActive && indicator === 'underline' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
