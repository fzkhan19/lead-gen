import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/retry";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { verifyEmailEligibility } from "./emailVerificationService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function performSearchRound(city: string, niche: string, round: number) {
  let prompt = '';
  if (round === 1) {
    prompt = `CRITICAL MISSION: Find as many real businesses as possible in ${city} for the ${niche} niche. 
       Focus on businesses that likely lack a modern website. 
       PRIORITY: Find ACTUAL, VERIFIED email addresses. DO NOT hallucinate.
       Return ONLY a JSON array of objects.`;
  } else if (round === 2) {
    prompt = `CRITICAL MISSION: Find even more real businesses in ${city} for the ${niche} niche. 
       Look in specific neighborhoods and business districts. 
       Focus on businesses that likely lack a modern website. 
       PRIORITY: Find ACTUAL, VERIFIED email addresses. DO NOT hallucinate.
       Return ONLY a JSON array of objects.`;
  } else {
    prompt = `CRITICAL MISSION: Final sweep for ${niche} in ${city}. 
       Look in surrounding outskirts and smaller towns nearby. 
       Focus on businesses that likely lack a modern website. 
       PRIORITY: Find ACTUAL, VERIFIED email addresses. DO NOT hallucinate.
       Return ONLY a JSON array of objects.`;
  }

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            BusinessName: { type: Type.STRING },
            Address: { type: Type.STRING },
            PhoneNumber: { type: Type.STRING },
            Website: { type: Type.STRING, nullable: true },
            Email: { type: Type.STRING, nullable: true },
            maps_url: { type: Type.STRING }
          },
          required: ['BusinessName', 'Address', 'PhoneNumber', 'maps_url']
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error(`Round ${round} failed to parse:`, e);
    return [];
  }
}

export async function runFullSearch(city: string, niche: string, onProgress?: (msg: string) => void) {
  if (!auth.currentUser) throw new Error("Authentication required");

  onProgress?.(`[AI] Round 1: Broad market scan...`);
  const results1 = await performSearchRound(city, niche, 1);
  
  onProgress?.(`[AI] Round 2: Deep neighborhood scan...`);
  const results2 = await performSearchRound(city, niche, 2);

  onProgress?.(`[AI] Round 3: Surrounding areas & outskirts...`);
  const results3 = await performSearchRound(city, niche, 3);
  
  const allResults = [...results1, ...results2, ...results3];
  
  // Deduplicate by BusinessName
  const uniqueResults = Array.from(new Map(allResults.map(item => [item.BusinessName, item])).values());
  
  onProgress?.(`[SYSTEM] Found ${uniqueResults.length} unique candidates. Filtering and saving...`);

  const savedLeads = [];
  for (const lead of uniqueResults) {
    // Discard if website exists
    if (lead.Website || lead.website) continue;

    const email = lead.Email || lead.email;
    if (email) {
      onProgress?.(`[VERIFIER] Checking ${email}...`);
      const verification = await verifyEmailEligibility(email, lead.BusinessName);
      if (!verification.isValid || verification.score < 40) {
        onProgress?.(`[VERIFIER] Skipping ${lead.BusinessName} - Ineligible email.`);
        continue;
      }
    }

    const leadData = {
      uid: auth.currentUser.uid,
      businessName: lead.BusinessName,
      address: lead.Address || 'Unknown',
      phone: lead.PhoneNumber || 'Unknown',
      email: lead.Email || null,
      website: lead.Website || null,
      city,
      niche,
      status: 'qualified',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'leads'), leadData);
    savedLeads.push({ id: docRef.id, ...leadData });
  }

  return savedLeads;
}
