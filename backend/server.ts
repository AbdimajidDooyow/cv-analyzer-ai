import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const port = Number(process.env.PORT || 4000);
const aiKey = process.env.GEMINI_API_KEY;
const ai = aiKey ? new GoogleGenAI({ apiKey: aiKey }) : null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "..", "dist");

app.use(express.json({ limit: "2mb" }));

function createAnalysisSchema() {
  return {
    type: Type.OBJECT,
    required: [
      "match_score",
      "match_label",
      "summary",
      "score_breakdown",
      "strengths",
      "weaknesses",
      "missing_skills",
      "improvement_suggestions",
      "rewritten_experience",
      "ats_analysis",
      "interview_questions",
      "confidence_tips",
    ],
    properties: {
      match_score: { type: Type.NUMBER },
      match_label: { type: Type.STRING, enum: ["Perfect Match", "Good Match", "Could Be Better", "Poor Match"] },
      summary: { type: Type.STRING },
      score_breakdown: {
        type: Type.OBJECT,
        required: ["skills_match", "experience_match", "keywords_match", "formatting", "ats_compatibility"],
        properties: {
          skills_match: { type: Type.NUMBER },
          experience_match: { type: Type.NUMBER },
          keywords_match: { type: Type.NUMBER },
          formatting: { type: Type.NUMBER },
          ats_compatibility: { type: Type.NUMBER },
        },
      },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      rewritten_experience: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["original", "improved"],
          properties: {
            original: { type: Type.STRING },
            improved: { type: Type.STRING },
          },
        },
      },
      ats_analysis: {
        type: Type.OBJECT,
        required: ["issues", "fixes"],
        properties: {
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          fixes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      interview_questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["question", "reason"],
          properties: {
            question: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
        },
      },
      confidence_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  };
}

function ensureAiReady() {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing.");
  }
}

function validateTextInput(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}`);
  }

  return value.trim();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/analyze", async (req, res) => {
  try {
    ensureAiReady();
    const cvText = validateTextInput(req.body?.cvText, "cvText");
    const jobDescription = validateTextInput(req.body?.jobDescription, "jobDescription");

    const prompt = `
You are an expert HR recruiter and career coach.
Analyze the following resume against the job description. IMPORTANT: Address the user directly in the second person ("you", "your resume", "your experience") instead of referring to "the candidate", "his", or "her". This app is for the job seeker to evaluate their own CV.

Resume:
${cvText}

Job Description:
${jobDescription}

IMPORTANT: Use simple, plain English in your responses. Avoid complex corporate jargon.
Return a structured and helpful evaluation in JSON format.
`;

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: createAnalysisSchema(),
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Full Analysis API Error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed.";
    res.status(400).json({ error: message });
  }
});

app.post("/api/rewrite", async (req, res) => {
  try {
    ensureAiReady();
    const cvText = validateTextInput(req.body?.cvText, "cvText");
    const jobDescription = validateTextInput(req.body?.jobDescription, "jobDescription");

    const prompt = `
You are an expert resume writer and recruiter.
Rewrite the following candidate's resume to match the provided Job Description perfectly.

IMPORTANT: Use simple, plain English. Focus on making the experience sound impactful and professional.

Resume:
${cvText}

Job Description:
${jobDescription}

Return ONLY the rewritten resume content in professional Markdown format.
`;

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ rewrittenCv: response.text || "Failed to rewrite CV." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rewrite failed.";
    res.status(400).json({ error: message });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});