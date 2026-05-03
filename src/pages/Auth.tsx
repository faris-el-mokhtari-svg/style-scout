import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PASSWORD_MIN = 8;

function SharpInput({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-[7px]">
      <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        style={{ borderRadius: 0 }}
        className="w-full h-11 px-3 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground transition-colors duration-150"
      />
    </div>
  );
}

function SharpPasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-[7px]">
      <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground block">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          style={{ borderRadius: 0 }}
          className="w-full h-11 px-3 pr-10 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground transition-colors duration-150"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show
            ? <EyeOff className="size-3.5" strokeWidth={1.5} />
            : <Eye className="size-3.5" strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= PASSWORD_MIN, label: `${PASSWORD_MIN}+ Zeichen` },
    { ok: /[A-Z]/.test(password), label: "Großbuchstabe" },
    { ok: /[0-9]/.test(password), label: "Zahl" },
  ];
  return (
    <div className="flex gap-5 mt-2.5">
      {checks.map(c => (
        <span
          key={c.label}
          className={cn(
            "text-[9px] tracking-[0.07em] uppercase flex items-center gap-1 transition-colors duration-150",
            c.ok ? "text-like" : "text-muted-foreground/40"
          )}
        >
          <Check className="size-2.5 flex-shrink-0" strokeWidth={3} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

type Tab = "signin" | "signup";

export default function Auth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Passwort erfüllt die Anforderungen nicht");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("registered")
        ? "Diese E-Mail ist bereits registriert."
        : error.message);
    } else {
      toast.success("Account erstellt — check deine Mails.");
      navigate("/");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      toast.error("Google Login fehlgeschlagen");
      return;
    }
    if (result.redirected) return;
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-[15px]">
      {/* Wordmark */}
      <div className="pt-16 pb-12">
        <span
          className="text-foreground font-medium select-none block"
          style={{ fontSize: "1.5rem", letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          CUR8
        </span>
        <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mt-2">
          Deine Leinwand.
        </p>
      </div>

      {/* Tab switcher — same underline pattern as Discover categories */}
      <div className="flex border-b border-border mb-8">
        {(["signin", "signup"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 pb-3 text-[11px] tracking-[0.08em] uppercase font-medium transition-colors border-b-[1.5px] -mb-[1px]",
              tab === t
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            {t === "signin" ? "Einloggen" : "Registrieren"}
          </button>
        ))}
      </div>

      {/* Sign in form */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <SharpInput
            label="E-Mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <SharpPasswordInput
            label="Passwort"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-foreground text-background text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-foreground/90 active:opacity-80 transition-colors disabled:opacity-40 flex items-center justify-center mt-2"
            style={{ borderRadius: 0 }}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Einloggen"}
          </button>
        </form>
      )}

      {/* Sign up form */}
      {tab === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <SharpInput
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
            required
          />
          <SharpInput
            label="E-Mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <div>
            <SharpPasswordInput
              label="Passwort"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordRequirements password={password} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-foreground text-background text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-foreground/90 active:opacity-80 transition-colors disabled:opacity-40 flex items-center justify-center mt-2"
            style={{ borderRadius: 0 }}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Account erstellen"}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">oder</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google — outlined, sharp */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full h-11 border border-border text-foreground text-[10px] tracking-[0.08em] uppercase font-medium hover:bg-secondary active:opacity-80 transition-colors disabled:opacity-40 flex items-center justify-center gap-3"
        style={{ borderRadius: 0 }}
      >
        <svg className="size-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Mit Google fortfahren
      </button>
    </div>
  );
}
