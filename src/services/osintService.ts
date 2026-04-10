import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/retry";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface OSINTResult {
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
  contactInfo: {
    emails: string[];
    phones: string[];
    ownerName?: string;
  };
  businessDetails: {
    website?: string;
    yearFounded?: string;
    employeeCount?: string;
    rating?: number;
    reviewCount?: number;
  };
  summary: string;
}

export async function performOSINT(businessName: string, city: string, niche: string): Promise<OSINTResult> {
  const prompt = `Perform a deep OSINT (Open Source Intelligence) search for the following business:
  Name: ${businessName}
  Location: ${city}
  Niche: ${niche}

  Search for:
  1. Social media profiles (Facebook, Instagram, LinkedIn, Twitter, YouTube).
  2. Direct contact information (emails, phone numbers). 
     - PRIORITY: Find the ACTUAL, VERIFIED email address.
     - DO NOT guess or hallucinate emails (e.g., don't just guess info@business.com).
     - Search specifically for "Contact Us" pages, Facebook "About" sections, or LinkedIn profiles.
  3. Business owner or key decision-maker names.
  4. Business details like website URL, founding year, and public ratings/reviews.

  Provide a comprehensive summary of your findings.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          socialMedia: {
            type: Type.OBJECT,
            properties: {
              facebook: { type: Type.STRING },
              instagram: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              twitter: { type: Type.STRING },
              youtube: { type: Type.STRING },
            },
          },
          contactInfo: {
            type: Type.OBJECT,
            properties: {
              emails: { type: Type.ARRAY, items: { type: Type.STRING } },
              phones: { type: Type.ARRAY, items: { type: Type.STRING } },
              ownerName: { type: Type.STRING },
            },
            required: ["emails", "phones"],
          },
          businessDetails: {
            type: Type.OBJECT,
            properties: {
              website: { type: Type.STRING },
              yearFounded: { type: Type.STRING },
              employeeCount: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              reviewCount: { type: Type.NUMBER },
            },
          },
          summary: { type: Type.STRING },
        },
        required: ["socialMedia", "contactInfo", "businessDetails", "summary"],
      },
    },
  }));

  try {
    const parts = response.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text);
    // Join all text parts, but filter out the system warning if it's present
    const text = textParts
      .filter(t => t && !t.includes("here are non-text parts toolCall"))
      .join("\n") || "{}";
    
    // Remove markdown code blocks if present
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanJson) as OSINTResult;
  } catch (e) {
    console.error("Failed to parse OSINT response:", e, response.text);
    throw new Error("OSINT data extraction failed. The AI response was not valid JSON.");
  }
}
