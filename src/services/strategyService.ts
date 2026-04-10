import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/retry";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getGlobalStrategy() {
  const prompt = `Act as a world-class B2B lead generation strategist. 
  Identify a high-value, low-competition niche and a rapidly growing US city where local businesses likely lack modern websites.
  
  Criteria:
  1. High-ticket services (e.g., HVAC, Roofing, Specialized Medical, Legal).
  2. High demand but low digital maturity in the area.
  3. Not overly saturated by major national franchises.
  
  Return ONLY a JSON object with:
  - niche: The specific business niche.
  - city: The target city and state.
  - reasoning: A brief explanation of why this is a high-opportunity target.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          niche: { type: Type.STRING },
          city: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["niche", "city", "reasoning"]
      }
    }
  }));

  return JSON.parse(response.text);
}
