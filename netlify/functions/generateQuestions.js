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

    const prompt = `Generate ${count} multiple choice CBT questions for the subject: ${subject}. 
    ${topic ? `Topic focus: ${topic}.` : ''} 
    Difficulty level: ${difficulty}. 
    Make sure exactly 4 options are provided for each question, labeled A, B, C, D.
    Provide a brief explanation for the correct answer.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
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
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      let errorMsg = "Failed to generate questions.";
      try {
        const errObj = JSON.parse(errorText);
        if (errObj.error && errObj.error.message) {
          errorMsg = errObj.error.message;
        }
      } catch(e) {}
      return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: errorMsg }) };
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const startIdx = rawText.indexOf('[');
    const endIdx = rawText.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      rawText = rawText.substring(startIdx, endIdx + 1);
    }
    
    let questionsData = [];
    try {
      questionsData = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse array:", rawText);
      throw new Error("Invalid format from AI");
    }

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
