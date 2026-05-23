import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Prevent caching of API responses globally
  app.use("/api", (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // AI Generation Route
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { subject, topic, difficulty, count } = req.body;
      if (!subject || !count) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Generate ${count} multiple choice CBT questions for the subject: ${subject}. 
      ${topic ? `Topic focus: ${topic}.` : ''} 
      Difficulty level: ${difficulty}. 
      Make sure exactly 4 options are provided for each question, labeled A, B, C, D.
      Provide a brief explanation for the correct answer.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The content of the question" },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING, description: "A, B, C, or D" },
                      text: { type: Type.STRING, description: "The option text" },
                    },
                    required: ["label", "text"]
                  },
                  description: "Exactly 4 options"
                },
                correctAnswer: { type: Type.STRING, description: "The exact label of the correct option (e.g., 'A', 'B', 'C', or 'D')" },
                explanation: { type: Type.STRING, description: "Brief explanation" }
              },
              required: ["text", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const rawText = response.text || "[]";
      const questionsData = JSON.parse(rawText);

      res.json({ questions: questionsData });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate questions." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // For hashed assets in /assets/, they can be cached, but document root html must not be cached 
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (!filePath.includes('/assets/')) {
          // Other root files like manifest.json, sw.js, etc. should also avoid aggressive caching
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
