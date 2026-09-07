import { useEffect, useState } from "react";
import { Target, FileText, Briefcase, Clock, Eye, ChevronDown, ChevronUp, Copy, FileDown } from "lucide-react";
import Button from "./Button";
import generateAnalysisPdf from "../utils/generatePdf";
import Markdown from "react-markdown";
import { fetchAnalyses } from "../services/analysisService";

export default function Dashboard({ onBack }: { onBack?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showInputs, setShowInputs] = useState(false);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'metrics'|'inputs'|'rewritten'|'ats'|'prep'>('overview');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAnalyses();
        if (!active) return;
        setItems(data.items || []);
        if ((data.items || []).length > 0) setSelected((data.items || [])[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted max-w-xl">Quick access to your recent analyses and rewritten CVs. Tap an item on the left to explore results; use the controls to reveal inputs or copy outputs.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile history toggle */}
          <Button variant="ghost" className="sm:hidden p-2" onClick={() => setShowHistoryMobile((s) => !s)} title={showHistoryMobile ? 'Hide history' : 'Show history'} icon={<Eye className="w-4 h-4" />} />
          {onBack && <Button variant="ghost" onClick={onBack} className="px-4 py-2 text-xs">Back</Button>}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: concise history (hidden on mobile unless toggled) */}
        <aside className={`lg:col-span-1 ${showHistoryMobile ? '' : 'hidden sm:block'}`}>
          <div className="glass-card p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold uppercase tracking-widest">History</div>
                <div className="text-xs text-muted">{items.length} items</div>
              </div>
              <div className="text-xs text-muted"><Clock className="w-4 h-4" /></div>
            </div>

            {loading && <div className="text-sm text-muted">Loading...</div>}
            {!loading && items.length === 0 && <div className="text-sm text-muted">No saved analyses yet.</div>}

            <ul className="space-y-3 max-h-[60vh] overflow-auto touch-auto">
              {items.map((it) => (
                <li key={it.id} className={`p-3 rounded-xl cursor-pointer transition-shadow border ${selected?.id === it.id ? 'border-blue-500 shadow-xl' : 'border-border hover:shadow-md'}`} onClick={() => { setSelected(it); setShowInputs(false); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{it.type}</div>
                      <div className="text-sm font-medium truncate max-w-[16rem]">{it.jobDescription}</div>
                    </div>
                    <div className="text-xs text-muted">{new Date(it.createdAt).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right: main detail panel */}
        <main className="lg:col-span-3">
          <div className="glass-card p-6">
            {!selected && (
              <div className="text-center py-20 text-sm text-muted">Select an analysis to view a clean, focused result.</div>
            )}

            {selected && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted">{selected.type}</div>
                    <h3 className="text-2xl font-bold tracking-tight">{selected.analysis?.match_label || 'Analysis Result'}</h3>
                    <p className="text-sm text-muted mt-1 max-w-2xl">{selected.analysis?.summary || 'No summary available.'}</p>
                  </div>

                    <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => { setShowInputs(!showInputs); }} title={showInputs ? 'Hide inputs' : 'Show inputs'} icon={showInputs ? <ChevronUp /> : <ChevronDown />} className="p-2" />
                    <Button variant="outline" onClick={() => generateAnalysisPdf(selected, `${selected.type || 'analysis'}_${new Date(selected.createdAt).toISOString()}.pdf`)} className="p-2" title="Download PDF" icon={<FileDown />} />
                    {selected.rewrittenCv && <Button variant="accent" onClick={() => navigator.clipboard.writeText(selected.rewrittenCv)} icon={<Copy />} className="p-2" title="Copy rewritten CV" />}
                  </div>
                </div>

                {/* Quick metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface rounded-lg border border-border text-center">
                    <div className="text-sm text-muted uppercase">Match Score</div>
                    <div className="text-3xl font-extrabold mt-2">{selected.analysis?.match_score ?? '—'}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg border border-border text-center">
                    <div className="text-sm text-muted uppercase">Strengths</div>
                    <div className="text-lg font-semibold mt-2">{(selected.analysis?.strengths || []).length}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg border border-border text-center">
                    <div className="text-sm text-muted uppercase">Weaknesses</div>
                    <div className="text-lg font-semibold mt-2">{(selected.analysis?.weaknesses || []).length}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg border border-border text-center">
                    <div className="text-sm text-muted uppercase">Missing Skills</div>
                    <div className="text-lg font-semibold mt-2">{(selected.analysis?.missing_skills || []).length}</div>
                  </div>
                </div>

                {/* Toggleable inputs */}
                {showInputs && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold">Resume</h4>
                      </div>
                      <div className="text-sm text-muted break-words max-h-40 overflow-auto">{selected.cvText}</div>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold">Job Description</h4>
                      </div>
                      <div className="text-sm text-muted break-words max-h-40 overflow-auto">{selected.jobDescription}</div>
                    </div>
                  </div>
                )}

                {/* Tabbed analysis sections (Overview | Metrics | Inputs | Rewritten | ATS | Prep) */}
                <div>
                  <div className="sticky top-24 z-20 bg-card/60 backdrop-blur-sm p-2 rounded-2xl border border-border mb-4 flex gap-2">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'metrics', label: 'Metrics' },
                      { id: 'inputs', label: 'Inputs' },
                      { id: 'rewritten', label: 'Rewritten' },
                      { id: 'ats', label: 'ATS' },
                      { id: 'prep', label: 'Prep' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-3 py-2 text-sm rounded-xl font-semibold transition-all ${activeTab === t.id ? 'tab-active shadow-md' : 'text-muted hover:text-foreground'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    {activeTab === 'overview' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-surface border border-border rounded-lg">
                          <h4 className="font-semibold mb-2">Summary</h4>
                          <p className="text-sm text-muted">{selected.analysis?.summary}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-card border border-border rounded-lg">
                            <h5 className="font-semibold mb-2">Strengths</h5>
                            <ul className="list-disc list-inside text-sm text-muted">{(selected.analysis?.strengths || []).map((s:any,i:number)=>(<li key={i}>{s}</li>))}</ul>
                          </div>
                          <div className="p-4 bg-card border border-border rounded-lg">
                            <h5 className="font-semibold mb-2">Weaknesses</h5>
                            <ul className="list-disc list-inside text-sm text-muted">{(selected.analysis?.weaknesses || []).map((s:any,i:number)=>(<li key={i}>{s}</li>))}</ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'metrics' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">Score Breakdown</h5>
                          <ul className="text-sm space-y-1">{selected.analysis?.score_breakdown && (Object.entries(selected.analysis.score_breakdown) as [string, number][]).map(([k, v]) => (<li key={k} className="flex items-center justify-between"><span className="text-muted">{k.replace('_',' ')}</span><span className="font-medium">{v}</span></li>))}</ul>
                        </div>

                        <div className="p-6 bg-card border border-border rounded-lg min-h-[220px]">
                          <h5 className="font-semibold mb-2">Improvement Suggestions</h5>
                          <ol className="list-decimal list-inside text-sm text-muted space-y-2">{(selected.analysis?.improvement_suggestions || []).map((s:any,i:number)=>(<li key={i}>{s}</li>))}</ol>
                        </div>
                      </div>
                    )}

                    {activeTab === 'inputs' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">Resume</h5>
                          <div className="text-sm text-muted break-words max-h-60 overflow-auto">{selected.cvText}</div>
                        </div>
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">Job Description</h5>
                          <div className="text-sm text-muted break-words max-h-60 overflow-auto">{selected.jobDescription}</div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'rewritten' && (
                      <div>
                        {selected.rewrittenCv ? (
                          <div className="p-4 bg-card border border-border rounded-lg">
                            <div className="prose prose-sm dark:prose-invert max-w-none"><Markdown>{selected.rewrittenCv}</Markdown></div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted">No rewritten CV available for this item.</div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ats' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">ATS Analysis - Issues</h5>
                          <ul className="list-disc list-inside text-sm text-muted">{(selected.analysis?.ats_analysis?.issues || []).map((it:any,i:number)=>(<li key={i}>{it}</li>))}</ul>
                        </div>
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">ATS Fixes</h5>
                          <ul className="list-disc list-inside text-sm text-muted">{(selected.analysis?.ats_analysis?.fixes || []).map((it:any,i:number)=>(<li key={i}>{it}</li>))}</ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'prep' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">Interview Questions</h5>
                          <ul className="text-sm space-y-2">{(selected.analysis?.interview_questions || []).map((q:any,i:number)=>(<li key={i}><div className="font-semibold">{q.question}</div><div className="text-xs text-muted">{q.reason}</div></li>))}</ul>
                        </div>
                        <div className="p-4 bg-card border border-border rounded-lg">
                          <h5 className="font-semibold mb-2">Confidence Tips</h5>
                          <ul className="list-disc list-inside text-sm text-muted">{(selected.analysis?.confidence_tips || []).map((t:any,i:number)=>(<li key={i}>{t}</li>))}</ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
