import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/retry";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EmailVerificationResult {
  isValid: boolean;
  score: number; // 0 to 100
  reason: string;
  isRoleBased: boolean;
  isDisposable: boolean;
}

export async function verifyEmailEligibility(email: string, businessName: string): Promise<EmailVerificationResult> {
  // 1. Basic Syntax Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, score: 0, reason: "Invalid syntax", isRoleBased: false, isDisposable: false };
  }

  // 2. AI-Powered Heuristic Check
  // We use Gemini to check if the email looks "real" and relevant to the business
  const prompt = `Act as an email deliverability expert. 
  Analyze the following email address for a business named "${businessName}".
  Email: "${email}"
  
  Check for:
  - Is it a generic role-based email (info@, admin@, contact@)?
  - Does it look like a disposable/temporary email?
  - Does the username part look like a real person or a random string?
  - Is the domain relevant to the business name?
  
  Return ONLY a JSON object with:
  - isValid: boolean (true if it's a safe, high-quality email to send to)
  - score: number (0-100, where 100 is a personal business email like john@business.com)
  - reason: string (brief explanation)
  - isRoleBased: boolean
  - isDisposable: boolean`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            isRoleBased: { type: Type.BOOLEAN },
            isDisposable: { type: Type.BOOLEAN }
          },
          required: ["isValid", "score", "reason", "isRoleBased", "isDisposable"]
        }
      }
    }));

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Email verification AI check failed:", error);
    // Fallback to basic valid result if AI fails but syntax is ok
    return { isValid: true, score: 50, reason: "Syntax valid (AI check failed)", isRoleBased: false, isDisposable: false };
  }
}
