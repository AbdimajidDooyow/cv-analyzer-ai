import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Sparkles,
  ShieldAlert,
  User,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Button from "./Button";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

type AuthCardProps = {
  session: Session | null;
  onAuthenticated: () => void;
  onStartAnalyze: () => void;
  onSignOut: () => Promise<void>;
};

type Mode = "sign-in" | "sign-up";

export default function AuthCard({
  session,
  onAuthenticated,
  onStartAnalyze,
  onSignOut,
}: AuthCardProps) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasSupabaseConfig || !supabase) {
      setError("Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    if (mode === "sign-up" && !fullName.trim()) {
      setError("Enter your name for the new account.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          onAuthenticated();
          return;
        }

        setSuccess("Account created successfully. Please check your email to confirm.");
        setMode("sign-in");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      onAuthenticated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <div id="auth-panel" className="glass-card relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted font-bold mb-3">Secure Access</p>
              <h3 className="text-2xl font-medium tracking-tighter uppercase">You are signed in</h3>
            </div>
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-surface">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3 text-sm text-secondary">
              <User className="w-4 h-4 text-blue-600" />
              <span>{session.user.email}</span>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              Your session is active. You can jump into analysis and store results against this account.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="accent"
              onClick={onStartAnalyze}
              icon={<ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />}
              iconPosition="right"
              className="w-full px-6 py-4 text-xs"
            >
              Start Analysis
            </Button>
            <Button
              variant="outline"
              onClick={onSignOut}
              icon={<LogOut size={16} />}
              className="w-full px-6 py-4 text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="auth-panel" className="glass-card relative overflow-hidden p-6 md:p-8">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_45%)]" />
      <div className="relative z-10 space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border p-2 bg-surface">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${
              mode === "sign-in" ? "bg-card text-foreground shadow-lg" : "text-muted hover:text-foreground"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${
              mode === "sign-up" ? "bg-card text-foreground shadow-lg" : "text-muted hover:text-foreground"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>

        {!hasSupabaseConfig && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before testing auth.
            </span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {mode === "sign-up" && (
              <motion.div
                key="full-name"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`peer input-field transition-all focus:placeholder-transparent ${fullName ? "!pl-5" : "!pl-14 focus:!pl-5"}`}
                  />
                  <User className={`pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60 transition-all duration-300 peer-focus:opacity-0 peer-focus:scale-75 peer-focus:-translate-x-5 ${fullName ? "opacity-0 scale-75 -translate-x-5" : "opacity-100 scale-100"}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`peer input-field transition-all focus:placeholder-transparent ${email ? "!pl-5" : "!pl-14 focus:!pl-5"}`}
              />
              <Mail className={`pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60 transition-all duration-300 peer-focus:opacity-0 peer-focus:scale-75 peer-focus:-translate-x-5 ${email ? "opacity-0 scale-75 -translate-x-5" : "opacity-100 scale-100"}`} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`peer input-field transition-all focus:placeholder-transparent ${password ? "!pl-5" : "!pl-14 focus:!pl-5"}`}
              />
              <Lock className={`pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60 transition-all duration-300 peer-focus:opacity-0 peer-focus:scale-75 peer-focus:-translate-x-5 ${password ? "opacity-0 scale-75 -translate-x-5" : "opacity-100 scale-100"}`} />
            </div>
          </div>

          <Button
            type="submit"
            variant="accent"
            isLoading={loading}
            icon={loading ? <Loader2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            className="w-full px-6 py-4 text-xs"
          >
            {mode === "sign-up" ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                key="auth-success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}