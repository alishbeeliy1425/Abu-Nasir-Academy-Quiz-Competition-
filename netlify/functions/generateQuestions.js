const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { subject, topic, difficulty, count } = JSON.parse(event.body);

    if (!subject || !count) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured." })
      };
    }

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

    const questionsData = JSON.parse(response.text());

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
      body: JSON.stringify({ error: error.message || "Failed to generate questions. Model timeout or error." })
    };
  }
};
