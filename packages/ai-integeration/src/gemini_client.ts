import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 200,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          reasoning: { type: SchemaType.STRING },
          alternatives: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["category", "confidence", "reasoning", "alternatives"],
      },
    },
  });
};
