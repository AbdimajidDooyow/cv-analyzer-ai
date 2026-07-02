import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  TrendingUp, 
  Target, 
  Cpu, 
  Loader2,
  Sparkles,
  ClipboardCheck,
  Zap,
  Copy,
  PenTool,
  Edit3,
  Download,
  FileDown,
  X
} from "lucide-react";
import Markdown from "react-markdown";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { analyzeCV, CVAnalysisResult, rewriteCV } from "../services/geminiService";
import Button from "./Button";

type CVAnalyzerProps = {
  onBack?: () => void;
};

export default function CVAnalyzer({ onBack }: CVAnalyzerProps) {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [rewrittenCv, setRewrittenCv] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cvExportRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "optimization" | "technical" | "preparation">("overview");

  const handleAnalyze = async () => {
    if (!cvText || !jobDescription) {
      setError("Please provide both CV and Job Description");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setRewrittenCv(null);
    try {
      const data = await analyzeCV(cvText, jobDescription);
      setResult(data);
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please check your inputs and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (!cvText || !jobDescription) return;
    setIsRewriting(true);
    // Only clear result if we're doing a full overhaul, otherwise we might be in the optimization tab
    if (!result) setRewrittenCv(null);
    try {
      const text = await rewriteCV(cvText, jobDescription);
      setRewrittenCv(text);
    } catch (err) {
      console.error(err);
      setError("Rewrite failed. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert for now, can be improved to a toast
    alert("Copied to clipboard!");
  };

  const exportPDF = async () => {
    if (!cvExportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cvExportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("Optimized_CV.pdf");
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportWord = () => {
    if (!rewrittenCv) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
    const footer = "</body></html>";
    // Basic conversion from markdown to simple HTML for Word
    // Since we're using Markdown, we should ideally convert it to HTML first
    // For now, we'll wrap the rendered markdown's HTML or just the text
    const sourceHTML = header + (cvExportRef.current?.innerHTML || rewrittenCv) + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'Optimized_CV.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const getMatchColor = (label: string) => {
    switch (label) {
      case "Perfect Match": return "bg-emerald-500";
      case "Good Match": return "bg-blue-500";
      case "Could Be Better": return "bg-amber-500";
      case "Poor Match": return "bg-rose-500";
      default: return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="max-w-[90rem] mx-auto px-8 py-6 transition-colors duration-300">
      <header className="mb-6 border-b border-border pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium tracking-tighter uppercase text-foreground">Analysis Setup</h1>
        </div>
        {onBack && (
          <Button
            variant="ghost"
            onClick={() => {
              if (result || rewrittenCv) {
                setResult(null);
                setRewrittenCv(null);
              } else {
                onBack();
              }
            }}
            icon={<ChevronRight className="w-4 h-4 rotate-180" />}
            className="px-4 py-2 text-xs"
          >
            Back
          </Button>
        )}
      </header>

      <div className="max-w-screen-xl mx-auto">
        {/* Input Phase - Shown when there are no results */}
        {(!result && !rewrittenCv) ? (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="flex flex-col group">
                <div className="flex items-center justify-between space-x-3 mb-4 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-600" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Your Resume</h2>
                  </div>
                </div>
                <textarea
                  className="w-full flex-1 bg-transparent border border-border hover:border-muted p-6 h-[300px] md:h-[40vh] md:min-h-[300px] md:max-h-[450px] resize-none focus:outline-none focus:border-blue-600 dark:focus:border-blue-600 transition-colors font-mono text-xs leading-relaxed text-foreground"
                  placeholder="Paste your current resume here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                />
              </div>

              <div className="flex flex-col group">
                <div className="flex items-center justify-between space-x-3 mb-4 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-blue-600" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Job Description</h2>
                  </div>
                </div>
                <textarea
                  className="w-full flex-1 bg-transparent border border-border hover:border-muted p-6 h-[300px] md:h-[40vh] md:min-h-[300px] md:max-h-[450px] resize-none focus:outline-none focus:border-blue-600 dark:focus:border-blue-600 transition-colors font-mono text-xs leading-relaxed text-foreground"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto mt-4">
              <Button
                variant="accent"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isRewriting || !cvText || !jobDescription}
                isLoading={isAnalyzing}
                icon={<Target className="w-4 h-4" />}
                className="flex-1 py-5 text-xs"
              >
                {isAnalyzing ? "Processing..." : "Run Analysis"}
              </Button>

              <Button
                variant="outline"
                onClick={handleRewrite}
                disabled={isAnalyzing || isRewriting || !cvText || !jobDescription}
                isLoading={isRewriting}
                icon={<Edit3 className="w-4 h-4" />}
                className="flex-1 py-5 text-xs"
              >
                {isRewriting ? "Processing..." : "Auto-Rewrite Resume"}
              </Button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-4 text-red-500"
              >
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <AnimatePresence mode="wait">
              {rewrittenCv && !result ? (
              <motion.div 
                key="direct-rewrite"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                 <div className="glass-card p-6 md:p-10">
                  <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-8 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setRewrittenCv(null)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-hover transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div>
                        <h4 className="font-bold tracking-tight text-[var(--text-primary)]">New Resume Suggested</h4>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">AI Improvements Ready</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <Button 
                        variant="outline"
                        onClick={exportPDF}
                        disabled={isExporting}
                        isLoading={isExporting}
                        icon={<FileDown className="w-4 h-4" />}
                        className="flex-1 sm:flex-none h-10 px-6 text-[10px]"
                      >
                        PDF
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={exportWord}
                        icon={<Download className="w-4 h-4" />}
                        className="flex-1 sm:flex-none h-10 px-6 text-[10px]"
                      >
                        Word
                      </Button>
                      <button 
                        onClick={() => copyToClipboard(rewrittenCv!)}
                        className="h-10 w-10 flex items-center justify-center border border-border hover:border-muted text-foreground transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </header>

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div ref={cvExportRef} className="bg-card p-8 sm:p-12 rounded-2xl border border-border shadow-inner font-sans markdown-body">
                      <Markdown>{rewrittenCv}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : result && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Header */}
                <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
                  <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 dark:opacity-40 transition-all ${getMatchColor(result.match_label)}`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Your Match Results</span>
                      </div>
                      <h3 className="text-5xl font-black mb-6 tracking-tight text-[var(--text-primary)] leading-none">{result.match_label}</h3>
                      <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl">{result.summary}</p>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 pt-4 md:pt-0">
                      <div className="relative">
                        <div className={`text-8xl font-black tabular-nums transition-colors ${getScoreColor(result.match_score)}`}>
                          {result.match_score}
                        </div>
                        <div className="absolute -top-2 -right-4 text-2xl font-bold text-border">/100</div>
                      </div>
                      <div className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest">Match Index Score</div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-20 z-30 flex items-center bg-card/80 backdrop-blur-xl border border-border p-1.5 rounded-2xl shadow-lg">
                  {[
                    { id: "overview", label: "Overview", icon: Target },
                    { id: "optimization", label: "Better Points", icon: TrendingUp },
                    { id: "technical", label: "Resume Issues", icon: Cpu },
                    { id: "preparation", label: "Interview Prep", icon: ClipboardCheck },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-3 py-3 rounded-xl text-[11px] font-bold transition-all ${
                        activeTab === tab.id 
                          ? "tab-active shadow-xl" 
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="hidden sm:inline uppercase tracking-widest">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-[400px]"
                  >
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                           <div className="glass-card p-8">
                            <div className="flex items-center space-x-3 mb-6 text-emerald-500">
                              <CheckCircle2 className="w-6 h-6" />
                              <h4 className="font-bold uppercase text-[10px] tracking-widest">What You Do Well</h4>
                            </div>
                            <ul className="space-y-4">
                              {result.strengths.map((s, i) => (
                                <li key={i} className="text-sm flex items-start space-x-4 text-secondary">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                                  <span className="leading-relaxed">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="glass-card p-8">
                            <div className="flex items-center space-x-3 mb-6 text-amber-500">
                              <AlertCircle className="w-6 h-6" />
                              <h4 className="font-bold uppercase text-[10px] tracking-widest">What's Missing</h4>
                            </div>
                            <ul className="space-y-4">
                              {result.weaknesses.map((w, i) => (
                                <li key={i} className="text-sm flex items-start space-x-4 text-secondary">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />
                                  <span className="leading-relaxed">{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {result.missing_skills.length > 0 && (
                          <div className="glass-card p-8">
                            <h4 className="font-bold uppercase text-[10px] tracking-widest text-muted mb-6">Skills to add</h4>
                            <div className="flex flex-wrap gap-3">
                              {result.missing_skills.map((skill, i) => (
                                <span key={i} className="px-4 py-1.5 bg-surface rounded-xl text-xs font-bold text-secondary border border-border transition-colors hover:border-muted">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "optimization" && (
                      <div className="glass-card p-8 md:p-10">
                        <header className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-blue-500" />
                            </div>
                            <h4 className="font-bold tracking-tight uppercase text-xs tracking-widest text-[var(--text-primary)]">Resume Improvements</h4>
                          </div>
                          <div className="flex items-center space-x-4">
                            {!rewrittenCv && (
                              <button
                                onClick={handleRewrite}
                                disabled={isRewriting}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95 disabled:opacity-30 shadow-lg shadow-blue-600/15"
                              >
                                {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rewrite CV"}
                              </button>
                            )}
                          </div>
                        </header>
                        
                        {rewrittenCv ? (
                          <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/10 rounded-lg shrink-0">Analysis Complete</span>
                              <div className="flex items-center space-x-6">
                                <button 
                                  onClick={exportPDF}
                                  disabled={isExporting}
                                  className="flex items-center space-x-2 text-[10px] font-bold text-muted hover:text-emerald-600 transition-colors uppercase tracking-widest"
                                >
                                  {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                                  <span>Export</span>
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(rewrittenCv)}
                                  className="flex items-center space-x-2 text-[10px] font-bold text-muted hover:text-emerald-600 transition-colors uppercase tracking-widest"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-card p-8 sm:p-12 rounded-3xl border border-border shadow-sm font-sans markdown-body leading-relaxed overflow-hidden">
                              <div ref={cvExportRef}>
                                <Markdown>{rewrittenCv}</Markdown>
                              </div>
                            </div>
                            
                            <button 
                               onClick={() => setRewrittenCv(null)}
                               className="text-[10px] font-bold text-muted hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center space-x-2"
                            >
                              <span>← Back to Point Analysis</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-10">
                            {result.rewritten_experience.map((exp, i) => (
                              <div key={i} className="group pb-10 border-b border-border last:border-0 last:pb-0">
                                <div className="mb-6">
                                  <span className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] block mb-3">Original Version</span>
                                  <p className="text-sm text-secondary italic">"{exp.original}"</p>
                                </div>
                                <div className="bg-input p-6 rounded-2xl border border-border group-hover:border-emerald-500/30 transition-colors">
                                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em] block mb-3">Better way to say it</span>
                                  <p className="text-sm font-bold text-foreground leading-relaxed">{exp.improved}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "technical" && (
                      <div className="glass-card p-8 md:p-12 bg-card text-foreground">
                        <header className="flex items-center space-x-3 mb-12">
                          <Cpu className="w-8 h-8 text-blue-400" />
                          <div>
                            <h4 className="font-bold text-xl tracking-tight">Resume Problems</h4>
                            <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-bold">We found some issues that might stop recruiters from seeing your resume.</p>
                          </div>
                        </header>

                        <div className="grid md:grid-cols-2 gap-12">
                           <div className="space-y-8">
                            <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>Problems Found</span>
                            </h5>
                            <ul className="space-y-6">
                              {result.ats_analysis.issues.map((issue, i) => (
                                <li key={i} className="text-sm flex items-start space-x-5 text-muted group">
                                   <X className="w-5 h-5 text-rose-500/50 mt-0.5 shrink-0 group-hover:text-rose-500 transition-colors" />
                                   <span className="leading-relaxed">{issue}</span>
                                </li>
                              ))}
                            </ul>
                           </div>
                           
                           <div className="md:border-l md:border-white/5 md:pl-12 space-y-8">
                            <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>How to Fix</span>
                            </h5>
                            <ul className="space-y-6">
                              {result.ats_analysis.fixes.map((fix, i) => (
                                <li key={i} className="text-sm flex items-start space-x-5 text-secondary group">
                                   <CheckCircle2 className="w-5 h-5 text-emerald-500/50 mt-0.5 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                   <span className="leading-relaxed font-medium">{fix}</span>
                                </li>
                              ))}
                            </ul>
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "preparation" && (
                      <div className="space-y-8">
                        <div className="glass-card p-8 md:p-12 border-t-4 border-t-blue-500">
                          <header className="flex items-center space-x-3 mb-12">
                            <ClipboardCheck className="w-8 h-8 text-blue-500" />
                            <div>
                               <h4 className="font-bold text-xl tracking-tight dark:text-foreground">Interview Prep</h4>
                               <p className="text-[10px] text-muted dark:text-secondary uppercase tracking-[0.2em] font-bold">Common questions you might be asked for this job.</p>
                            </div>
                          </header>
                          
                          <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {result.interview_questions.map((q, i) => (
                              <div key={i} className="bg-blue-50/30 dark:bg-blue-500/10 p-6 rounded-3xl border border-blue-500/10 hover:border-blue-500/30 transition-all group">
                                <p className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-4 h-12 overflow-hidden">{q.question}</p>
                                <div className="pt-4 border-t border-blue-500/5 italic text-xs text-blue-700/60 dark:text-blue-500/50 leading-relaxed group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                  "{q.reason}"
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="p-8 bg-input rounded-3xl border border-border">
                            <h5 className="text-[10px] font-black text-muted dark:text-secondary uppercase tracking-[0.3em] mb-8">Tips for Confidence</h5>
                            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                                {result.confidence_tips.map((tip, i) => (
                                  <div key={i} className="flex items-start space-x-4 text-sm text-secondary dark:text-muted">
                                    <div className="w-5 h-5 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                                      <ChevronRight className="w-3.5 h-3.5 text-background" />
                                    </div>
                                    <span className="leading-relaxed">{tip}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>
    </div>
  );
}
