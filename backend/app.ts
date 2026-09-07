import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

const aiKey = process.env.GEMINI_API_KEY;
const ai = aiKey ? new GoogleGenAI({ apiKey: aiKey }) : null;
const mongoUri = process.env.MONGO_URI || "";
const mongoDbName = process.env.MONGO_DB_NAME || "recruitready";
const jwtSecret = process.env.JWT_SECRET || "replace_this_with_secure_secret";

const mongoClient = mongoUri ? new MongoClient(mongoUri) : null;
let mongoDbPromise: Promise<any> | null = null;

async function getMongoDb() {
  if (!mongoClient) {
    throw new Error("MongoDB not configured");
  }

  if (!mongoDbPromise) {
    mongoDbPromise = mongoClient.connect().then(() => mongoClient.db(mongoDbName));
  }

  return mongoDbPromise;
}

app.use(express.json({ limit: "2mb" }));
app.use(cors());

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers?.authorization;
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "Invalid Authorization format" });
  try {
    const payload: any = jwt.verify(parts[1], jwtSecret);
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

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

app.post("/api/auth/signup", async (req, res) => {
  try {
    const db = await getMongoDb();
    const { email, password, full_name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await db.collection("users").insertOne({ email: email.toLowerCase(), passwordHash, full_name: full_name || null, createdAt: now });
    const user = { id: result.insertedId.toString(), email: email.toLowerCase(), full_name: full_name || null };
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || "Signup failed" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const db = await getMongoDb();
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.passwordHash || "");
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id.toString(), email: user.email, full_name: user.full_name } });
  } catch (err: any) {
    console.error("Signin error:", err);
    res.status(500).json({ error: err.message || "Signin failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
  try {
    const db = await getMongoDb();
    const userId = req.userId;
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: user._id.toString(), email: user.email, full_name: user.full_name } });
  } catch (err: any) {
    console.error("Me error:", err);
    res.status(500).json({ error: err.message || "Failed" });
  }
});

app.post("/api/analysis/save", authMiddleware, async (req: any, res) => {
  try {
    const db = await getMongoDb();
    const userId = req.userId;
    const { type, cvText, jobDescription, analysis, rewrittenCv } = req.body || {};
    if (!type || !cvText || !jobDescription) return res.status(400).json({ error: "Missing fields" });
    const now = new Date();
    const doc: any = { userId: new ObjectId(userId), type, cvText, jobDescription, createdAt: now };
    if (analysis) doc.analysis = analysis;
    if (rewrittenCv) doc.rewrittenCv = rewrittenCv;
    const result = await db.collection("analyses").insertOne(doc);
    res.json({ id: result.insertedId.toString(), ok: true });
  } catch (err: any) {
    console.error("Save analysis error:", err);
    res.status(500).json({ error: err.message || "Failed to save" });
  }
});

app.get("/api/analysis", authMiddleware, async (req: any, res) => {
  try {
    const db = await getMongoDb();
    const userId = req.userId;
    const docs = await db
      .collection("analyses")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    const items = docs.map((d: any) => ({ id: d._id.toString(), type: d.type, cvText: d.cvText, jobDescription: d.jobDescription, analysis: d.analysis, rewrittenCv: d.rewrittenCv, createdAt: d.createdAt }));
    res.json({ items });
  } catch (err: any) {
    console.error("Get analyses error:", err);
    res.status(500).json({ error: err.message || "Failed" });
  }
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

export default app;