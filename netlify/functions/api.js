import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { subject, topic, difficulty, count } = JSON.parse(event.body);
    if (!subject || !count) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    if (!process.env.GEMINI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }) };
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

    let rawText = response.text || "[]";
    rawText = rawText.replace(/^```json/g, "").replace(/```$/g, "").trim();
    const questionsData = JSON.parse(rawText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: questionsData })
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to generate questions. Model timeout or error." })
    };
  }
};
