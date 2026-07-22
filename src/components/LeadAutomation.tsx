import { GoogleGenAI } from '@google/genai';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { auth, db } from '../firebase.ts';
import { getBestArchetype } from '../lib/designEngine.ts';
import { addCampaignLog } from '../services/logService.ts';

const ai = new GoogleGenAI({ apiKey: '' });

export default function LeadAutomation() {
  const processingLeads = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    const q = query(
      collection(db, 'leads'),
      where('uid', '==', auth.currentUser.uid),
      where('status', '==', 'mockup_ready'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docs.forEach(async (document) => {
          const lead = { id: document.id, ...document.data() } as any;

          if (processingLeads.current.has(lead.id)) {
            return;
          }

          processingLeads.current.add(lead.id);
          console.log(`[AUTOMATION] Triggering AI Campaign for: ${lead.businessName}`);

          try {
            const isDemo = localStorage.getItem('demo_mode') === 'true';
            if (isDemo) {
              await addCampaignLog({
                leadId: lead.id,
                leadName: lead.businessName,
                action: 'Campaign Started',
                status: 'info',
                message: `[Demo Mode] Initializing automated website and email generation pipeline.`,
              });

              // --- Staggered Presentation Automation Simulation ---
              await updateDoc(doc(db, 'leads', lead.id), {
                status: 'processing_campaign',
              });
              await new Promise((r) => setTimeout(r, 2500));

              const archetype = getBestArchetype(lead.businessName, lead.niche);
              const setupPrice = 349;
              const monthlyPrice = 19;
              const html = `
              <!DOCTYPE html>
              <html>
              <head>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body className="bg-zinc-950 text-zinc-50 min-h-screen flex flex-col justify-between font-sans">
                <main className="max-w-xl mx-auto text-center py-24 space-y-6 px-6">
                  <span className="text-xs font-mono tracking-widest text-brand-500 uppercase">${lead.niche} SPECIALIST</span>
                  <h1 className="text-4xl font-extrabold tracking-tight">${lead.businessName}</h1>
                  <p className="text-zinc-400 text-sm leading-relaxed">Elegant design paired with ultra-fast search engine optimization. Tailored specifically for local businesses in ${lead.city || 'your town'}.</p>
                  <button className="bg-white text-black font-bold px-6 py-3 rounded-lg text-sm hover:bg-zinc-200 transition-colors">Start Design Audit</button>
                </main>
              </body>
              </html>
            `;

              await updateDoc(doc(db, 'leads', lead.id), {
                status: 'outreach_sent',
                generatedHtml: html,
                designArchetype: archetype.id,
                offerPrice: setupPrice,
                subscriptionPrice: monthlyPrice,
                outreachSentAt: serverTimestamp(),
                last_outreach_attempt: serverTimestamp(),
              });

              await addCampaignLog({
                leadId: lead.id,
                leadName: lead.businessName,
                action: 'Website Generated',
                status: 'success',
                message: `[Demo Mode] Landing page successfully created using archetype: ${archetype.name}`,
              });

              await addCampaignLog({
                leadId: lead.id,
                leadName: lead.businessName,
                action: 'Outreach Sent',
                status: 'success',
                message: `[Demo Mode] Email proposal dispatched to ${lead.email || 'simulated@inbox.ai'}. Value: €${setupPrice} setup + €${monthlyPrice}/mo.`,
              });

              console.log(
                `[AUTOMATION] Simulated Demo Campaign completed for ${lead.businessName}.`,
              );
              return;
            }

            const targetEmail = lead.email || lead.osintData?.contactInfo?.emails?.[0];

            if (!targetEmail) {
              await addCampaignLog({
                leadId: lead.id,
                leadName: lead.businessName,
                action: 'Campaign Skipped',
                status: 'warning',
                message: `Skipped automated campaign for ${lead.businessName}: No email address found in record.`,
              });
              console.warn(`[AUTOMATION] Skipping ${lead.businessName} - No email found.`);
              await updateDoc(doc(db, 'leads', lead.id), {
                status: 'qualified', // Revert to qualified so user can fix it
              });
              return;
            }

            await addCampaignLog({
              leadId: lead.id,
              leadName: lead.businessName,
              action: 'Campaign Started',
              status: 'info',
              message: `Starting automated SDR outreach sequence. Delivery channel target: ${targetEmail}`,
            });

            // 0. Set status to processing to avoid double triggers
            await updateDoc(doc(db, 'leads', lead.id), {
              status: 'processing_campaign',
            });

            // 1. Select Design Archetype
            const archetype = getBestArchetype(lead.businessName, lead.niche);

            await addCampaignLog({
              leadId: lead.id,
              leadName: lead.businessName,
              action: 'Website Generation',
              status: 'info',
              message: `Generating custom responsive web page using '${archetype.name}' design profile.`,
            });

            // 2. Generate Website HTML
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Generate a full, single-page responsive landing page for "${lead.businessName}" in the "${lead.niche}" niche. 
            
            DESIGN STYLE: ${archetype.prompt}
            
            Include:
            - Modern hero section with a strong headline.
            - Services/Features section.
            - About Us section.
            - Contact form.
            - Footer.
            
            Return ONLY the full HTML code.`,
            });

            const html = response.text || '<html><body>Failed to generate.</body></html>';
            const setupPrice = Math.floor(Math.random() * (400 - 300 + 1)) + 300;
            const monthlyPrice = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

            // 3. Update Lead in Firestore
            await updateDoc(doc(db, 'leads', lead.id), {
              status: 'outreach_sent',
              generatedHtml: html,
              designArchetype: archetype.id,
              offerPrice: setupPrice,
              subscriptionPrice: monthlyPrice,
              outreachSentAt: serverTimestamp(),
              last_outreach_attempt: serverTimestamp(),
              email: targetEmail, // Update lead with found email
            });

            await addCampaignLog({
              leadId: lead.id,
              leadName: lead.businessName,
              action: 'Website Generated',
              status: 'success',
              message: `Custom web landing page built successfully. Pricing: €${setupPrice} setup, €${monthlyPrice}/mo hosting.`,
            });

            await addCampaignLog({
              leadId: lead.id,
              leadName: lead.businessName,
              action: 'SMTP Outreach',
              status: 'info',
              message: `Drafting and transmitting personalized pitch email to ${targetEmail}...`,
            });

            // 4. Send Outreach via API
            const fetchResult = await fetch('/api/send-outreach', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: lead.id,
                businessName: lead.businessName,
                email: targetEmail,
                offerPrice: setupPrice,
                subscriptionPrice: monthlyPrice,
                archetype: archetype.name,
              }),
            });

            if (fetchResult.ok) {
              await addCampaignLog({
                leadId: lead.id,
                leadName: lead.businessName,
                action: 'Outreach Sent',
                status: 'success',
                message: `SMTP transaction completed. Pitch proposal successfully delivered to ${targetEmail}.`,
              });
            } else {
              const errBody = await fetchResult.json().catch(() => ({}));
              throw new Error(errBody.error || errBody.details || 'Outreach email failed to send');
            }

            console.log(
              `[AUTOMATION] Campaign launched for ${lead.businessName} at ${targetEmail}. €${setupPrice} + €${monthlyPrice}/mo`,
            );
          } catch (error: any) {
            console.error(`[AUTOMATION] Error processing lead ${lead.id}:`, error);
            await addCampaignLog({
              leadId: lead.id,
              leadName: lead.businessName,
              action: 'Automation Pipeline',
              status: 'error',
              message: `Critical pipeline error: ${error?.message || String(error)}`,
            });
          } finally {
            processingLeads.current.delete(lead.id);
          }
        });
      },
      (error) => {
        console.error('[AUTOMATION] Snapshot error:', error);
      },
    );

    return unsubscribe;
  }, []);

  return null; // Background component
}
