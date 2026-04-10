import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/retry";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getBestArchetype } from "../lib/designEngine";
import { deployToGitHubPages } from "./githubService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWebsite(businessName: string, niche: string, city: string) {
  const archetype = getBestArchetype(businessName, niche);
  
  const prompt = `
    Generate a high-converting, professional landing page HTML for a business.
    Business Name: ${businessName}
    Niche: ${niche}
    Location: ${city}
    Style Archetype: ${archetype.prompt}
    
    The HTML must:
    1. Use Tailwind CSS via CDN.
    2. Be a single-page landing page.
    3. Include a hero section, services, about, and a contact form.
    4. Use placeholder images from Unsplash/Picsum.
    5. Be fully responsive and visually stunning.
    6. Include a clear Call to Action.
    
    Return ONLY the raw HTML string.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  }));

  // Clean the HTML output from potential markdown code blocks
  let html = response.text || '<html><body>Failed to generate.</body></html>';
  if (html.includes('```html')) {
    html = html.split('```html')[1].split('```')[0].trim();
  } else if (html.includes('```')) {
    html = html.split('```')[1].split('```')[0].trim();
  }

  if (!html.toLowerCase().startsWith('<!doctype')) {
    html = '<!DOCTYPE html>\n' + html;
  }

  return {
    html,
    archetype: archetype.id
  };
}

export async function launchCampaign(lead: any) {
  const { html, archetype } = await generateWebsite(lead.businessName, lead.niche, lead.city);
  
  // 1. Deploy to GitHub Pages
  console.log(`[CAMPAIGN] Deploying preview for ${lead.businessName}...`);
  const previewUrl = await deployToGitHubPages(lead.id, html);
  
  // 2. Generate a soulful sales pitch using Gemini
  console.log(`[CAMPAIGN] Generating sales pitch for ${lead.businessName}...`);
  const setupPrice = Math.floor(Math.random() * (299 - 199 + 1)) + 199; // Below market: €199-€299
  const monthlyPrice = 10; // Fixed attractive price
  
  const pitchPrompt = `
    Act as a charismatic, empathetic, and highly persuasive sales copywriter.
    Write a short, "soulful" outreach email for a business owner.
    
    Business: ${lead.businessName}
    Niche: ${lead.niche}
    Location: ${lead.city}
    Our Offer: A custom-built, high-converting website.
    Pricing: Only €${setupPrice} setup (one-time) and €${monthlyPrice}/mo for hosting and unlimited updates.
    Market Context: Most agencies charge €2,000+ for this. We are local-focused and want to help them grow.
    Preview Link: ${previewUrl || 'Attached to this email'}
    
    The email should:
    1. Start with a genuine compliment or observation about their business.
    2. Mention that we've already built a custom preview for them (the link).
    3. Explain the value of the €${monthlyPrice}/mo subscription (peace of mind, updates, hosting).
    4. Have a clear, low-friction call to action.
    5. Sound like a human, not a bot.
    
    Return ONLY a JSON object with:
    - subject: string
    - bodyHtml: string (use basic HTML tags for formatting)
    - bodyText: string
  `;

  const pitchResponse = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: pitchPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          bodyHtml: { type: Type.STRING },
          bodyText: { type: Type.STRING }
        },
        required: ["subject", "bodyHtml", "bodyText"]
      }
    }
  }));

  const { subject, bodyHtml, bodyText } = JSON.parse(pitchResponse.text);

  const sanitizeEmail = (email: any) => {
    if (!email || typeof email !== 'string') return null;
    const trimmed = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed) ? trimmed : null;
  };

  const sanitizeUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`;
    return null;
  };

  const leadRef = doc(db, 'leads', lead.id);
  await updateDoc(leadRef, {
    status: 'outreach_sent',
    generatedHtml: html,
    previewUrl: previewUrl || null,
    designArchetype: archetype,
    offerPrice: setupPrice,
    subscriptionPrice: monthlyPrice,
    outreachSentAt: serverTimestamp(),
    last_outreach_attempt: serverTimestamp(),
    email: sanitizeEmail(lead.email),
    website: sanitizeUrl(lead.website)
  });

  // 3. Send Outreach via API with the new pitch
  await fetch('/api/send-outreach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: lead.id,
      businessName: lead.businessName,
      email: lead.email,
      subject,
      bodyHtml,
      bodyText,
      previewUrl
    })
  });

  return { setupPrice, monthlyPrice, html, archetype, previewUrl };
}
