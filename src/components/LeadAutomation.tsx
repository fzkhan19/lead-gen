import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { GoogleGenAI } from '@google/genai';
import { getBestArchetype } from '../lib/designEngine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function LeadAutomation() {
  const processingLeads = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'leads'),
      where('uid', '==', auth.currentUser.uid),
      where('status', '==', 'mockup_ready')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (document) => {
        const lead = { id: document.id, ...document.data() } as any;
        
        if (processingLeads.current.has(lead.id)) return;
        
        processingLeads.current.add(lead.id);
        console.log(`[AUTOMATION] Triggering AI Campaign for: ${lead.businessName}`);
        
        try {
          const targetEmail = lead.email || lead.osintData?.contactInfo?.emails?.[0];

          if (!targetEmail) {
            console.warn(`[AUTOMATION] Skipping ${lead.businessName} - No email found.`);
            await updateDoc(doc(db, 'leads', lead.id), {
              status: 'qualified' // Revert to qualified so user can fix it
            });
            return;
          }

          // 0. Set status to processing to avoid double triggers
          await updateDoc(doc(db, 'leads', lead.id), {
            status: 'processing_campaign'
          });

          // 1. Select Design Archetype
          const archetype = getBestArchetype(lead.businessName, lead.niche);
          
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
            email: targetEmail // Update lead with found email
          });

          // 4. Send Outreach via API
          await fetch('/api/send-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              businessName: lead.businessName,
              email: targetEmail,
              offerPrice: setupPrice,
              subscriptionPrice: monthlyPrice,
              archetype: archetype.name
            })
          });

          console.log(`[AUTOMATION] Campaign launched for ${lead.businessName} at ${targetEmail}. €${setupPrice} + €${monthlyPrice}/mo`);
        } catch (error) {
          console.error(`[AUTOMATION] Error processing lead ${lead.id}:`, error);
          // We don't use handleFirestoreError here to avoid UI alerts from background process
        } finally {
          processingLeads.current.delete(lead.id);
        }
      });
    }, (error) => {
      console.error('[AUTOMATION] Snapshot error:', error);
    });

    return unsubscribe;
  }, []);

  return null; // Background component
}
