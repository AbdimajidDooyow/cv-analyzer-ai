import { useState, useEffect } from "react";
import { Sun, Moon, Target, TrendingUp, Edit3, MessageSquare, ArrowRight, LogOut, User, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import * as authService from "./services/authService";
import CVAnalyzer from "./components/CVAnalyzer";
import Dashboard from "./components/Dashboard";
import Button from "./components/Button";
import AuthCard from "./components/AuthCard";
// supabase client is no longer used for auth

export default function App() {
  const [view, setView] = useState<"landing" | "auth" | "analyze" | "dashboard">("landing");
  const [session, setSession] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await authService.getCurrentUser();
      if (!active) return;
      setSession(user);
      setAuthReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleAnalyzeClick = () => {
    if (!session) {
      setView("auth");
      return;
    }
    setView("analyze");
  };

  const handleSignOut = async () => {
    await authService.signout();
    setSession(null);
    setView("landing");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* NAV */}
      <nav className="h-24 flex items-center justify-between px-8 mx-auto w-full border-b border-border relative z-20 bg-background/80 backdrop-blur-sm">
        <div className="font-bold text-2xl tracking-tighter cursor-pointer flex items-center gap-3 uppercase" onClick={() => setView("landing") }>
          <img src="/logo.png" alt="Hirely Logo" className="w-8 h-8 object-contain" />
          Hirely
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {authReady && session && (
            <div className="hidden md:flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
              <User size={14} className="text-blue-600" />
              <span className="max-w-[14rem] truncate">{(session.full_name && session.full_name.split(' ')[0]) || (session.email && session.email.split('@')[0])}</span>
            </div>
          )}

          {authReady && !session && view !== "auth" && (
            <Button
              variant="ghost"
              onClick={() => setView("auth")}
              icon={<Sparkles size={14} />}
              className="px-4 py-2 text-[10px]"
            >
              Sign In
            </Button>
          )}

          {authReady && session && (
            <>
              <Button variant="ghost" onClick={() => setView('dashboard')} className="px-4 py-2 text-[10px]">Dashboard</Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                icon={<LogOut size={14} />}
                className="px-4 py-2 text-[10px]"
              >
                Sign Out
              </Button>
            </>
          )}

          <button onClick={() => setIsDark(!isDark)} className="transition-colors text-foreground hover:text-blue-600 dark:hover:text-blue-500">
            {isDark ? <Sun size={20} className="stroke-[1.5]" /> : <Moon size={20} className="stroke-[1.5]" />}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main>
        {view === "landing" ? (
          <div className="max-w-screen-2xl mx-auto px-8">
            
            {/* HERO: INTEGRATED STRUCTURAL GRID (NO BOX THROWN OUNCE OF NOWHERE) */}
            <section className="border-b border-border relative overflow-hidden">
              
              {/* Seamless structural grid lines backing the entire viewport section */}
              <div className="absolute inset-0 z-0 opacity-30 dark:opacity-[0.15] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
              
              {/* Refined background glow rings */}
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/[0.05] rounded-full blur-[130px] pointer-events-none z-0" />
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-[100px] pointer-events-none z-0" />

              {/* The layout structure directly aligns horizontally and vertically */}
              <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10 divide-y lg:divide-y-0 lg:divide-x divide-border">
                
                {/* Left Segment: Typography Matrix */}
                <div className="lg:col-span-7 pt-16 pb-24 pl-2 lg:pl-6 pr-0 lg:pr-12 flex flex-col justify-center min-h-[50vh] lg:min-h-[70vh]">
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-8">
                    AI-Powered Resume Checker
                  </span>
                  <h1 className="text-5xl sm:text-7xl xl:text-[7.5rem] font-medium tracking-tighter leading-[0.85] uppercase flex flex-col">
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      Format.
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    >
                      Analyze.
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    >
                      Get Hired.
                    </motion.span>
                  </h1>
                </div>

                {/* Right Segment: Functional Panel Matrix */}
                <div className="lg:col-span-5 pt-16 pb-24 lg:pl-12 flex flex-col justify-center bg-surface/[0.15] backdrop-blur-[2px]">
                  <div className="w-full max-w-md mx-auto flex flex-col items-center text-center gap-8">
                    
                    {/* Visual Space Anchor with micro technical framing details */}
                    <div className="w-full max-w-[15rem] aspect-square flex items-center justify-center relative">
                      <div className="absolute -top-2 -left-2 w-3 h-3 border-t border-l border-border/60" />
                      <div className="absolute -top-2 -right-2 w-3 h-3 border-t border-r border-border/60" />
                      <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b border-l border-border/60" />
                      <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b border-r border-border/60" />
                      
                      <DotLottieReact
                        src="https://lottie.host/236ca1d1-3a02-475a-ac9e-194034956f1f/rvoi7MisEf.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    
                    <p className="text-sm text-secondary leading-relaxed font-mono max-w-sm border-t border-b border-border/40 py-5 w-full">
                      Compare your CV to any job description to surface match score, skill gaps, and concrete edits.
                    </p>
                    
                    <Button
                      variant="accent"
                      onClick={handleAnalyzeClick}
                      icon={<ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />}
                      iconPosition="right"
                      className="w-full px-8 py-5 text-xs justify-between uppercase tracking-widest font-mono"
                    >
                      Start Analysis
                    </Button>
                  </div>
                </div>

              </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-32 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-8">
                <div className="md:col-span-4">
                  <h2 className="text-2xl font-medium tracking-tighter uppercase">How It Works</h2>
                </div>
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
                  <div className="flex flex-col">
                    <span className="text-5xl font-light mb-8 text-border tracking-tighter">01</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-t border-border pt-6">Add Resume</h3>
                    <p className="text-secondary font-mono text-sm leading-relaxed">Paste your current resume or CV into the system.</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-5xl font-light mb-8 text-border tracking-tighter">02</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-t border-border pt-6">Add Job</h3>
                    <p className="text-secondary font-mono text-sm leading-relaxed">Paste the exact job description you want to apply for.</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-5xl font-light mb-8 text-blue-600/30 tracking-tighter">03</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-t border-blue-600 pt-6 text-blue-600">Get Results</h3>
                    <p className="text-secondary font-mono text-sm leading-relaxed">Get your match score, feedback, and ways to improve.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURES */}
            <section className="py-32 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-8">
                <div className="md:col-span-4">
                  <h2 className="text-2xl font-medium tracking-tighter uppercase">What You Get</h2>
                </div>
                <div className="md:col-span-8 flex flex-col border-t border-border">
                  {/* Row 1 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-8 border-b border-border group hover:pl-4 transition-all">
                    <div className="flex items-center gap-6">
                      <Target size={24} className="text-blue-600 stroke-[1.5]" />
                      <h3 className="text-3xl font-medium uppercase tracking-tighter">Match Score</h3>
                    </div>
                    <p className="text-muted font-mono text-sm mt-4 sm:mt-0 uppercase tracking-widest">ATS Check</p>
                  </div>
                  {/* Row 2 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-8 border-b border-border group hover:pl-4 transition-all">
                    <div className="flex items-center gap-6">
                      <TrendingUp size={24} className="text-blue-600 stroke-[1.5]" />
                      <h3 className="text-3xl font-medium uppercase tracking-tighter">Missing Skills</h3>
                    </div>
                    <p className="text-muted font-mono text-sm mt-4 sm:mt-0 uppercase tracking-widest">Keyword Gaps</p>
                  </div>
                  {/* Row 3 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-8 border-b border-border group hover:pl-4 transition-all">
                    <div className="flex items-center gap-6">
                      <Edit3 size={24} className="text-blue-600 stroke-[1.5]" />
                      <h3 className="text-3xl font-medium uppercase tracking-tighter">Resume Edits</h3>
                    </div>
                    <p className="text-muted font-mono text-sm mt-4 sm:mt-0 uppercase tracking-widest">Line Fixes</p>
                  </div>
                  {/* Row 4 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-8 group hover:pl-4 transition-all">
                    <div className="flex items-center gap-6">
                      <MessageSquare size={24} className="text-blue-600 stroke-[1.5]" />
                      <h3 className="text-3xl font-medium uppercase tracking-tighter">Interview Prep</h3>
                    </div>
                    <p className="text-muted font-mono text-sm mt-4 sm:mt-0 uppercase tracking-widest">Custom Q&A</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-32">
              <div className="flex flex-col items-start lg:items-center lg:text-center">
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-muted mb-6">Ready To Start?</span>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tighter uppercase mb-12">
                  Check Your CV Now
                </h2>
                <Button
                  variant="accent"
                  onClick={handleAnalyzeClick}
                  icon={<ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />}
                  iconPosition="right"
                  className="px-12 py-6 text-sm w-full sm:w-auto"
                >
                  Analyze My CV
                </Button>
              </div>
            </section>
          </div>
        ) : view === "auth" ? (
          <div className="max-w-screen-2xl mx-auto px-8 py-20 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md">
              <AuthCard
                session={session}
                onAuthenticated={async () => {
                  const user = await authService.getCurrentUser();
                  setSession(user);
                  setView("analyze");
                }}
                onStartAnalyze={handleAnalyzeClick}
                onSignOut={handleSignOut}
              />
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setView("landing")}
                  icon={<ChevronRight className="w-4 h-4 rotate-180" />}
                  className="px-4 py-3 text-[10px]"
                >
                  Back to Landing
                </Button>
                {session && (
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    icon={<LogOut className="w-4 h-4" />}
                    className="px-4 py-3 text-[10px]"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard onBack={() => setView('landing')} />
        ) : (
          <CVAnalyzer onBack={() => setView("landing")} session={session} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-8 px-8 border-t border-border font-mono text-xs uppercase tracking-[0.2em] text-muted flex justify-center items-center">
        <span>© 2026 Hirely</span>
      </footer>
    </div>
  );
}