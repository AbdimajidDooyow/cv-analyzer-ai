export interface CVAnalysisResult {
  match_score: number;
  match_label: "Perfect Match" | "Good Match" | "Could Be Better" | "Poor Match";
  summary: string;
  score_breakdown: {
    skills_match: number;
    experience_match: number;
    keywords_match: number;
    formatting: number;
    ats_compatibility: number;
  };
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
  rewritten_experience: {
    original: string;
    improved: string;
  }[];
  ats_analysis: {
    issues: string[];
    fixes: string[];
  };
  interview_questions: {
    question: string;
    reason: string;
  }[];
  confidence_tips: string[];
}

export async function analyzeCV(cvText: string, jobDescription: string): Promise<CVAnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cvText, jobDescription }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || "Analysis failed. Please try again.");
  }

  return response.json();
}

export async function rewriteCV(cvText: string, jobDescription: string): Promise<string> {
  const response = await fetch("/api/rewrite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cvText, jobDescription }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || "Rewrite failed. Please try again.");
  }

  const data = await response.json();
  return data.rewrittenCv || "Failed to rewrite CV.";
}
