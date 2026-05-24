import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subject, topic, difficulty, count } = req.body;
  if (!subject || !count) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
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
      model: "gemini-3.1-pro-preview",
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

    res.status(200).json({ questions: questionsData });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate questions." });
  }
}
