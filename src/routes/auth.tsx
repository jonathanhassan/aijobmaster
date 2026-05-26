import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Briefcase, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(6, "Min 6 caractères").max(72),
});
const signupSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(50),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(6, "Min 6 caractères").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const signupForm = useForm({ resolver: zodResolver(signupSchema), defaultValues: { first_name: "", email: "", password: "", confirm: "" } });

  const onLogin = loginForm.handleSubmit(async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenue 👋");
    navigate({ to: "/dashboard" });
  });

  const onSignup = signupForm.handleSubmit(async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { first_name: values.first_name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé !");
    navigate({ to: "/dashboard" });
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">JobMaster AI Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">Votre carrière, propulsée par l'IA</p>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-1 p-1 rounded-lg bg-muted mb-6">
            <button onClick={() => setMode("login")} className={`flex-1 py-2 text-sm rounded-md transition ${mode === "login" ? "gradient-primary text-white" : "text-muted-foreground"}`}>Connexion</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-2 text-sm rounded-md transition ${mode === "signup" ? "gradient-primary text-white" : "text-muted-foreground"}`}>Inscription</button>
          </div>

          {mode === "login" ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" {...loginForm.register("password")} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-white border-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSignup} className="space-y-4">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" {...signupForm.register("first_name")} />
                {signupForm.formState.errors.first_name && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.first_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" {...signupForm.register("email")} />
                {signupForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="signup-pw">Mot de passe</Label>
                <Input id="signup-pw" type={showPw ? "text" : "password"} autoComplete="new-password" {...signupForm.register("password")} />
                {signupForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirmation</Label>
                <Input id="confirm" type={showPw ? "text" : "password"} autoComplete="new-password" {...signupForm.register("confirm")} />
                {signupForm.formState.errors.confirm && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.confirm.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-white border-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer mon compte"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
