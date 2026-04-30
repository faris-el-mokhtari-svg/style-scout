import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2, Eye, EyeOff, Check } from "lucide-react";

const PASSWORD_MIN = 8;

function PasswordField({
  value, onChange, show, onToggle, autoComplete,
}: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete: string }) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="rounded-2xl h-12 pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Passwort verstecken" : "Passwort anzeigen"}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= PASSWORD_MIN, label: `Mindestens ${PASSWORD_MIN} Zeichen` },
    { ok: /[A-Z]/.test(password), label: "Ein Großbuchstabe" },
    { ok: /[0-9]/.test(password), label: "Eine Zahl" },
  ];
  return (
    <ul className="space-y-1 text-xs mt-1.5">
      {checks.map(c => (
        <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? "text-like" : "text-muted-foreground"}`}>
          <Check className={`size-3 ${c.ok ? "opacity-100" : "opacity-30"}`} strokeWidth={3} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

export default function Auth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Passwort erfüllt die Anforderungen nicht");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("registered")) toast.error("Diese E-Mail ist bereits registriert. Logg dich ein.");
      else toast.error(error.message);
    } else {
      toast.success("Account erstellt! Check deine Mails.");
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
    <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl gradient-primary shadow-glow mb-4">
            <Sparkles className="size-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-gradient mb-2">StyleMatch</h1>
          <p className="text-muted-foreground">Shazam für Mode ✨</p>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-card">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-4 rounded-2xl">
              <TabsTrigger value="signin" className="rounded-xl">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <Label>E-Mail</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl h-12" />
                </div>
                <div>
                  <Label>Passwort</Label>
                  <PasswordField value={password} onChange={setPassword} show={showSignInPw} onToggle={() => setShowSignInPw(s => !s)} autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Einloggen"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} className="rounded-2xl h-12" />
                </div>
                <div>
                  <Label>E-Mail</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl h-12" />
                </div>
                <div>
                  <Label>Passwort</Label>
                  <Input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl h-12" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Account erstellen"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground font-bold">oder</span></div>
          </div>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full h-12 rounded-2xl font-bold">
            <svg className="size-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Mit Google fortfahren
          </Button>
        </div>
      </div>
    </div>
  );
}
