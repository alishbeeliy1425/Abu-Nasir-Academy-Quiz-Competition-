import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Generate ${count} multiple choice CBT questions for the subject: ${subject}. 
      ${topic ? `Topic focus: ${topic}.` : ''} 
      Difficulty level: ${difficulty}. 
      Make sure exactly 4 options are provided for each question, labeled A, B, C, D.
      Provide a brief explanation for the correct answer.
      Return the output strictly as a JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    text: { type: "STRING", description: "The content of the question" },
                    options: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                label: { type: "STRING", description: "A, B, C, or D" },
                                text: { type: "STRING", description: "The option text" }
                            },
                            required: ["label", "text"]
                        },
                        description: "Exactly 4 options"
                    },
                    correctAnswer: { type: "STRING", description: "The exact label of the correct option (e.g., 'A', 'B', 'C', or 'D')" },
                    explanation: { type: "STRING", description: "Brief explanation" }
                },
                required: ["text", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const questionsData = JSON.parse(response.text);
      res.json({ questions: questionsData });
    } catch (error: any) {
      console.error("AI Generation Error:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to generate questions." });
    }
  });

  // Paystack verification route
  app.get("/api/verify-payment/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!secretKey) {
        return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Paystack verification error:", error);
      res.status(500).json({ error: "Verification failed" });
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
