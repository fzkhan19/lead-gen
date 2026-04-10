import { GoogleGenAI, Type } from "@google/genai";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Message {
  role: 'user' | 'lead';
  content: string;
  timestamp: any;
  sentiment?: string;
}

export async function analyzeAndReply(lead: any, replyText: string) {
  const prompt = `
    You are an expert sales negotiator for a web design agency. 
    A lead just replied to our outreach. 
    
    LEAD INFO:
    Business: ${lead.businessName}
    Niche: ${lead.niche}
    Original Offer: €${lead.offerPrice} setup + €${lead.subscriptionPrice}/mo
    
    LEAD REPLY:
    "${replyText}"
    
    MISSION:
    1. Analyze the sentiment (Interested, Skeptical, Price-Sensitive, Not Interested).
    2. Generate a persuasive response to close the deal.
    3. STRATEGY: If they are price-sensitive, you have permission to "lowball" the price. 
       Our goal is to get 10 clients at €10/mo. If they push back on the setup fee, you can drop it significantly or remove it.
    
    Return a JSON object with:
    - sentiment: string
    - responseText: string
    - suggestedNewOffer: { setupPrice: number, monthlyPrice: number } | null
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          responseText: { type: Type.STRING },
          suggestedNewOffer: {
            type: Type.OBJECT,
            properties: {
              setupPrice: { type: Type.NUMBER },
              monthlyPrice: { type: Type.NUMBER }
            },
            nullable: true
          }
        },
        required: ["sentiment", "responseText"]
      }
    }
  });

  const result = JSON.parse(response.text);

  // Update Firestore
  const leadRef = doc(db, 'leads', lead.id);
  
  const leadMessage: Message = {
    role: 'lead',
    content: replyText,
    timestamp: new Date().toISOString(),
    sentiment: result.sentiment
  };

  const aiMessage: Message = {
    role: 'user',
    content: result.responseText,
    timestamp: new Date().toISOString()
  };

  const updates: any = {
    status: 'replied',
    messages: arrayUnion(leadMessage, aiMessage)
  };

  if (result.suggestedNewOffer) {
    updates.offerPrice = result.suggestedNewOffer.setupPrice;
    updates.subscriptionPrice = result.suggestedNewOffer.monthlyPrice;
  }

  await updateDoc(leadRef, updates);

  return result;
}

export async function simulateIncomingReply(leadId: string, businessName: string) {
  const replies = [
    "This sounds interesting, but the setup fee is a bit high for us right now.",
    "Can you show me more examples of your work?",
    "We already have a website, but it's old. What makes yours better?",
    "I'm interested, but I'm not sure if €300 is worth it for a small shop like mine.",
    "How fast can you get this live?",
    "Is the €10/mo fixed or will it increase?"
  ];
  
  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  
  // In a real app, this would be an incoming webhook from an email provider.
  // Here we just trigger the analysis directly.
  return randomReply;
}
