import { useState, useEffect } from 'react';
import { withRetry } from '../lib/retry';
import { 
  Mail, 
  ExternalLink, 
  MoreVertical, 
  Filter, 
  Download,
  Trash2,
  Eye,
  Send,
  Sparkles,
  Loader2,
  Zap,
  Rocket,
  DollarSign,
  MapPin,
  Phone,
  Users,
  Globe,
  X,
  Search,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Star,
  Calendar,
  Building2,
  Wand2,
  MessageSquare,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import WebsitePreview from './WebsitePreview';
import { performOSINT } from '../services/osintService';
import { launchCampaign } from '../services/campaignService';
import { getBestArchetype } from '../lib/designEngine';
import { getGlobalStrategy } from '../services/strategyService';
import { runFullSearch } from '../services/prospectorService';
import { verifyEmailEligibility } from '../services/emailVerificationService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function LeadsTable() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState({ current: 0, total: 0 });
  const [currentLeadName, setCurrentLeadName] = useState<string | null>(null);
  const [activeEnrichment, setActiveEnrichment] = useState<string | null>(null);
  const [activeFullPipeline, setActiveFullPipeline] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'outreach_sent' | 'replied'>('all');
  const [showAutoPilotConfirm, setShowAutoPilotConfirm] = useState(false);
  const [isGlobalAutoPilot, setIsGlobalAutoPilot] = useState(false);
  const [autoPilotMessage, setAutoPilotMessage] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'leads'), 
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });
    return unsubscribe;
  }, []);

  const clearAllLeads = async () => {
    if (!auth.currentUser) return;
    setShowClearConfirm(false);
    
    try {
      const deletePromises = leads.map(lead => deleteDoc(doc(db, 'leads', lead.id)));
      await Promise.all(deletePromises);
      setAutoPilotMessage("All leads cleared successfully.");
    } catch (error) {
      console.error("Failed to clear leads:", error);
      setAutoPilotMessage("Failed to clear some leads.");
    }
  };

  const startAutoPilot = async () => {
    const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'new');
    setShowAutoPilotConfirm(false);
    setIsAutoPiloting(true);
    
    try {
      if (qualifiedLeads.length === 0) {
        // GLOBAL AUTO-PILOT MODE
        setIsGlobalAutoPilot(true);
        setAutoPilotMessage("Initiating Global Strategy Mode...");
        
        // 1. Get Strategy
        setCurrentLeadName("AI Strategist");
        const strategy = await getGlobalStrategy();
        setAutoPilotMessage(`Strategy identified: ${strategy.niche} in ${strategy.city}`);
        console.log("[STRATEGY]", strategy);
        
        // 2. Scrape
        setCurrentLeadName("Prospector Bot");
        const newLeads = await runFullSearch(strategy.city, strategy.niche, (msg) => {
          setAutoPilotMessage(msg);
        });
        
        if (newLeads.length === 0) {
          setAutoPilotMessage("Global search complete, but no qualified leads were found. Try again later.");
          return;
        }
        
        setAutoPilotMessage(`Found ${newLeads.length} leads. Starting outreach sequence...`);
        
        // 3. Outreach
        let count = 0;
        for (const lead of newLeads) {
          setCurrentLeadName(lead.businessName);
          setAutoPilotProgress({ current: count, total: newLeads.length });
          
          try {
            const hasEmail = !!(lead.email);
            if (!hasEmail) continue;

            await runFullPipeline(lead, true);
          } catch (err) {
            console.error(`[AUTOPILOT] Failed to process ${lead.businessName}:`, err);
          }
          
          count++;
          setAutoPilotProgress({ current: count, total: newLeads.length });
          if (count < newLeads.length) await new Promise(r => setTimeout(r, 5000));
        }
      } else {
        // NORMAL AUTO-PILOT MODE
        setAutoPilotProgress({ current: 0, total: qualifiedLeads.length });
        let count = 0;
        for (const lead of qualifiedLeads) {
          setCurrentLeadName(lead.businessName);
          setAutoPilotProgress({ current: count, total: qualifiedLeads.length });
          
          try {
            const hasEmail = !!(lead.email || lead.osintData?.contactInfo?.emails?.[0]);
            if (!hasEmail) continue;

            await runFullPipeline(lead, true);
          } catch (err) {
            console.error(`[AUTOPILOT] Failed to process ${lead.businessName}:`, err);
          }
          
          count++;
          setAutoPilotProgress({ current: count, total: qualifiedLeads.length });
          if (count < qualifiedLeads.length) await new Promise(r => setTimeout(r, 5000));
        }
      }
      
      setCurrentLeadName(null);
      setAutoPilotMessage(`Mission complete!`);
    } catch (error) {
      console.error("Auto-Pilot failed:", error);
      setAutoPilotMessage("Auto-Pilot encountered a critical error.");
    } finally {
      setIsAutoPiloting(false);
      setIsGlobalAutoPilot(false);
      setAutoPilotProgress({ current: 0, total: 0 });
      setCurrentLeadName(null);
    }
  };

  const runBulkAutoPilot = () => {
    setShowAutoPilotConfirm(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.niche.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'new') return matchesSearch && lead.status === 'qualified';
    return matchesSearch && lead.status === filter;
  }).sort((a, b) => {
    const aHasEmail = !!(a.email || a.osintData?.contactInfo?.emails?.[0]);
    const bHasEmail = !!(b.email || b.osintData?.contactInfo?.emails?.[0]);
    
    if (aHasEmail && !bHasEmail) return -1;
    if (!aHasEmail && bHasEmail) return 1;
    
    // Secondary sort by date (newest first)
    const aDate = a.createdAt?.seconds || 0;
    const bDate = b.createdAt?.seconds || 0;
    return bDate - aDate;
  });

  const handleDelete = async (id: string) => {
    setLeadToDelete(id);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await deleteDoc(doc(db, 'leads', leadToDelete));
      setLeadToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${leadToDelete}`);
    }
  };

  const enrichLead = async (lead: any) => {
    setActiveEnrichment(lead.id);
    try {
      const osintData = await performOSINT(lead.businessName, lead.city, lead.niche);

      await updateDoc(doc(db, 'leads', lead.id), {
        osintData,
        status: 'qualified'
      });

      if (selectedLead?.id === lead.id) {
        setSelectedLead({ ...selectedLead, osintData });
      }
    } catch (error: any) {
      console.error("Enrichment failed:", error);
      alert("Intelligence enrichment failed. Please try again later.");
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
    } finally {
      setActiveEnrichment(null);
    }
  };

  const generateMockup = async (lead: any) => {
    setIsGeneratingMockup(true);
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a high-conversion website mockup description for a business named "${lead.businessName}" in the "${lead.niche}" niche. 
        Focus on:
        1. Hero section headline
        2. Color palette
        3. Key features to highlight
        4. Call to action
        
        Provide a short, punchy summary that I can send to the client.`,
      }));

      const mockupDescription = response.text || 'Mockup strategy generated.';
      
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'mockup_ready',
        mockupDescription
      });
      
      setSelectedLead({ ...lead, status: 'mockup_ready', mockupDescription });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const launchAICampaign = async (lead: any, silent = false) => {
    // Check both the lead object passed and the potential osintData it might have
    const leadEmail = lead.email;
    const osintEmail = lead.osintData?.contactInfo?.emails?.[0];
    
    if (!leadEmail && !osintEmail) {
      if (!silent) alert(`No email found for ${lead.businessName}. Please enrich data or add an email manually before launching a campaign.`);
      return;
    }

    const targetEmail = leadEmail || osintEmail;

    // --- EMAIL ELIGIBILITY CHECK ---
    if (!silent) setAutoPilotMessage(`Verifying email eligibility for ${targetEmail}...`);
    const verification = await verifyEmailEligibility(targetEmail, lead.businessName);
    
    if (!verification.isValid || verification.score < 40) {
      console.warn(`[VERIFICATION] Skipping ${lead.businessName} - Email ineligible: ${verification.reason} (Score: ${verification.score})`);
      if (!silent) setAutoPilotMessage(`Skipping ${lead.businessName}: ${verification.reason}`);
      
      // Mark lead as invalid in Firestore so we don't try again
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'invalid_email',
        verificationReason: verification.reason,
        verificationScore: verification.score
      });
      return;
    }
    // -------------------------------

    if (!silent) setIsLaunchingCampaign(true);
    try {
      // 0. Set status to processing
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'processing_campaign'
      });

      const { setupPrice, monthlyPrice, html, archetype } = await withRetry(() => launchCampaign({
        ...lead,
        email: targetEmail
      }));

      if (!silent) {
        setPreviewHtml(html);
        setSelectedLead({ ...lead, status: 'outreach_sent', generatedHtml: html, offerPrice: setupPrice, subscriptionPrice: monthlyPrice, designArchetype: archetype, email: targetEmail });
      }
      
      console.log(`[CAMPAIGN] Outreach sent to ${lead.businessName} at ${targetEmail}. Offer: €${setupPrice} + €${monthlyPrice}/mo`);
      
    } catch (error) {
      if (!silent) handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
      else console.error(`Campaign launch failed for ${lead.id}:`, error);
    } finally {
      if (!silent) setIsLaunchingCampaign(false);
    }
  };

  const runFullPipeline = async (lead: any, silent = false) => {
    if (!silent) setActiveFullPipeline(lead.id);
    try {
      // 1. Intelligence Enrichment (Scrape & Enrich)
      console.log(`[PIPELINE] Enriching ${lead.businessName}...`);
      const osintData = await withRetry(() => performOSINT(lead.businessName, lead.city, lead.niche));
      
      // Update Firestore with OSINT data first
      await updateDoc(doc(db, 'leads', lead.id), {
        osintData,
        status: 'qualified'
      });

      // 2. Build & Outreach (Website + Email)
      console.log(`[PIPELINE] Launching Campaign for ${lead.businessName}...`);
      // We pass the updated lead data (with osintData) to launchAICampaign
      await launchAICampaign({ ...lead, osintData }, silent);
      
    } catch (error: any) {
      console.error("Full Pipeline failed:", error);
      if (!silent) alert("Full Automation Pipeline failed. Please check the logs.");
    } finally {
      if (!silent) setActiveFullPipeline(null);
    }
  };

  const sendOutreach = async (lead: any) => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'outreach_sent',
        outreachSentAt: new Date().toISOString()
      });
      setAutoPilotMessage(`Outreach sent to ${lead.businessName}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {leadToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-8 rounded-[40px] border border-white/[0.05] max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-4">Delete Lead?</h3>
              <p className="text-brand-700 mb-8">
                This action cannot be undone. All intelligence and assets for this lead will be permanently removed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setLeadToDelete(null)}
                  className="btn-md btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteLead}
                  className="btn-md btn-danger flex-1"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showAutoPilotConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-8 rounded-[40px] border border-white/[0.05] max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <Wand2 className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white text-center mb-4">
                {leads.filter(l => l.status === 'qualified' || l.status === 'new').length === 0 
                  ? 'Launch Global Strategy Mission?' 
                  : 'Launch Global Outreach Mission?'}
              </h3>
              <p className="text-brand-700 text-center mb-8">
                {leads.filter(l => l.status === 'qualified' || l.status === 'new').length === 0 
                  ? 'No leads detected. AI will automatically identify a high-opportunity niche/city, scrape leads, and initiate outreach.' 
                  : `You are about to initiate the Full Automation Pipeline for ${leads.filter(l => l.status === 'qualified' || l.status === 'new').length} leads. This will enrich data, build custom websites, and deploy outreach emails.`}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAutoPilotConfirm(false)}
                  className="btn-md btn-secondary flex-1"
                >
                  Abort
                </button>
                <button 
                  onClick={startAutoPilot}
                  className="btn-md btn-accent flex-1"
                >
                  Initiate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence>
        {autoPilotMessage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass p-8 rounded-[40px] border border-white/[0.05] max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <p className="text-white font-medium mb-6">{autoPilotMessage}</p>
              <button 
                onClick={() => setAutoPilotMessage(null)}
                className="btn-primary w-full py-3"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Mission Control (Appears during Auto-Pilot) */}
      <AnimatePresence>
        {isAutoPiloting && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-[40px] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden">
              <div className="p-8 border-b border-white/[0.02] flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  <h3 className="font-display font-bold text-xl text-white tracking-tight">Bulk Mission Control</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">Global Progress</span>
                    <span className="text-sm font-mono text-white">{Math.round((autoPilotProgress.current / autoPilotProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${(autoPilotProgress.current / autoPilotProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Active Target</h4>
                  <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 animate-pulse">
                      <Rocket className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg tracking-tight">
                        {currentLeadName || 'Finalizing...'}
                      </p>
                      <p className="text-[10px] text-brand-600 font-mono uppercase mt-1">Processing Pipeline Step 1-4</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Live Status Feed</h4>
                  <div className="h-24 bg-black/40 rounded-3xl p-5 font-mono text-[11px] text-brand-400 overflow-y-auto custom-scrollbar border border-white/[0.02]">
                    <div className="flex items-center gap-3 text-brand-500">
                      <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                      <span>Bulk sequence initiated for {autoPilotProgress.total} targets...</span>
                    </div>
                    <div className="flex items-center gap-3 text-white mt-1">
                      <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                      <span>Processing lead {autoPilotProgress.current + 1} of {autoPilotProgress.total}</span>
                    </div>
                    <div className="flex items-center gap-3 text-brand-600 mt-1">
                      <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                      <span>Executing OSINT Enrichment & Asset Generation...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass p-10 rounded-[40px] border border-white/[0.05] shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Trash2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-4">Wipe Intelligence Database?</h3>
              <p className="text-brand-600 mb-10 leading-relaxed">This will permanently delete all leads from your command center. This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="btn-md btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={clearAllLeads}
                  className="btn-md btn-danger flex-1"
                >
                  Wipe All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="glass p-8 rounded-[40px] border border-white/[0.03] shadow-2xl flex flex-col xl:flex-row gap-8 items-center justify-between">
        <div className="relative w-full xl:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-700 group-focus-within:text-white transition-colors" />
          <input 
            type="text"
            placeholder="Search Intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-950/50 border border-white/[0.03] rounded-2xl py-4 pl-12 pr-4 text-white focus:border-white/[0.1] focus:ring-4 focus:ring-white/[0.02] outline-none transition-all placeholder:text-brand-800 font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto justify-center xl:justify-end">
          {/* Utility Actions */}
          <div className="flex items-center gap-3 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.03]">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-xs btn-ghost text-brand-400 hover:text-white hover:bg-white/5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wipe Database
            </button>
          </div>

          {/* Main Action */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={runBulkAutoPilot}
              disabled={isAutoPiloting}
              className="btn-md btn-accent px-8"
            >
              {isAutoPiloting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isAutoPiloting ? `MISSION_IN_PROGRESS (${autoPilotProgress.current}/${autoPilotProgress.total})` : 'LAUNCH AUTO-PILOT MISSION'}
            </button>
            <span className="text-[8px] font-mono text-brand-700 uppercase tracking-[0.3em] font-black">ENRICH + BUILD + OUTREACH</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-brand-950/50 p-1.5 rounded-2xl border border-white/[0.03]">
            {['all', 'new', 'outreach_sent', 'replied'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === tab 
                    ? "bg-white text-brand-950 shadow-lg" 
                    : "text-brand-600 hover:text-white"
                )}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-[40px] overflow-hidden border border-white/[0.03] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Niche</th>
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Last Contact</th>
                <th className="px-8 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="w-16 h-16 bg-brand-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/[0.03]">
                      <Users className="w-6 h-6 text-brand-700" />
                    </div>
                    <p className="text-brand-600 font-medium text-sm tracking-tight">No intelligence matches found.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, i) => (
                  <motion.tr 
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-white/[0.02] transition-all cursor-default"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-brand-950 rounded-2xl flex items-center justify-center border border-white/[0.03] group-hover:border-white/[0.1] transition-all relative overflow-hidden shadow-inner">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                          <span className="font-display font-bold text-lg text-brand-500 group-hover:text-white transition-all z-10">
                            {lead.businessName[0]}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white tracking-tight text-base group-hover:translate-x-1 transition-transform">{lead.businessName}</p>
                            {(lead.email || lead.osintData?.contactInfo?.emails?.[0]) && (
                              <div className="flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                                <Zap className="w-3 h-3 text-brand-500 fill-brand-500" />
                                <span className="text-[8px] font-black text-brand-500 uppercase tracking-tighter">Priority</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-brand-700 font-mono truncate max-w-[200px] mt-0.5">{lead.website || 'No Website'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-brand-500 font-medium text-sm">
                        <MapPin className="w-3.5 h-3.5 opacity-40" />
                        {lead.city}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/[0.03]">
                        {lead.niche}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className={cn(
                          "inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border transition-all",
                          lead.status === 'replied' ? "bg-brand-500/5 text-brand-300 border-brand-400/10" :
                          lead.status === 'outreach_sent' ? "bg-brand-500/5 text-brand-400 border-brand-400/10" :
                          "bg-brand-500/5 text-brand-500 border-brand-400/10"
                        )}>
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            lead.status === 'replied' ? "bg-brand-300" :
                            lead.status === 'outreach_sent' ? "bg-brand-400" :
                            "bg-brand-500"
                          )} />
                          {lead.status.replace('_', ' ')}
                        </div>
                        {lead.status === 'outreach_sent' && lead.email && (
                          <div className="flex items-center gap-1.5 text-[9px] text-brand-400 font-mono">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-white">
                          {lead.last_outreach_attempt ? new Date(lead.last_outreach_attempt).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-[10px] text-brand-700 font-mono uppercase tracking-widest">
                          {lead.last_outreach_attempt ? new Date(lead.last_outreach_attempt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => runFullPipeline(lead)}
                          disabled={activeFullPipeline === lead.id || lead.status === 'processing_campaign'}
                          className="btn-icon w-10 h-10 bg-white/5 border-white/10 text-brand-400 hover:bg-white hover:text-brand-950"
                          title="Full Automation (Enrich + Build + Outreach)"
                        >
                          {activeFullPipeline === lead.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                        </button>
                        {lead.status === 'replied' && (
                          <button 
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeTab', { detail: 'inbox' }));
                            }}
                            className="btn-icon w-10 h-10 bg-brand-400/20 border-brand-400/30 text-brand-300 hover:bg-brand-400 hover:text-white"
                            title="Negotiate & Close"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedLead(lead)}
                          className="btn-icon w-10 h-10"
                          title="View Entity Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => enrichLead(lead)}
                          disabled={activeEnrichment === lead.id}
                          className="btn-icon w-10 h-10"
                          title="Enrich Data"
                        >
                          {activeEnrichment === lead.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => launchAICampaign(lead)}
                          disabled={lead.status === 'processing_campaign'}
                          className="btn-icon w-10 h-10"
                          title="Launch AI Campaign"
                        >
                          <Rocket className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="btn-icon w-10 h-10 bg-white/5 border-white/10 text-brand-600 hover:bg-white hover:text-brand-950"
                          title="Purge Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-brand-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl glass rounded-[40px] shadow-2xl overflow-hidden border border-brand-800/50"
            >
              <div className="p-10 border-b border-brand-800/50 flex items-center justify-between bg-brand-900/20">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">{selectedLead.businessName}</h3>
                    <p className="text-xs font-mono text-brand-500 uppercase tracking-widest mt-1">Lead ID: {selectedLead.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-3 hover:bg-brand-800 rounded-2xl transition-colors text-brand-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-3 bg-white rounded-full" />
                      Business Intelligence
                    </h4>
                    <div className="space-y-3 bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30">
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-500 font-medium">Niche</span>
                        <span className="text-white font-bold">{selectedLead.niche}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-500 font-medium">City</span>
                        <span className="text-white font-bold">{selectedLead.city}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-brand-800/30">
                        <span className="text-brand-500 font-medium text-xs">Address</span>
                        <span className="text-brand-300 text-xs leading-relaxed">{selectedLead.address}</span>
                      </div>
                      {selectedLead.osintData?.businessDetails?.website && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-brand-800/30">
                          <span className="text-brand-500 font-medium text-xs">Website</span>
                          <a href={selectedLead.osintData.businessDetails.website} target="_blank" rel="noopener noreferrer" className="text-white font-bold text-xs hover:underline flex items-center gap-1">
                            {selectedLead.osintData.businessDetails.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-3 bg-white rounded-full" />
                      Contact Matrix
                    </h4>
                    <div className="space-y-3 bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-brand-500 font-medium text-xs">Phone</span>
                        <span className="text-white font-bold text-sm">{selectedLead.phone}</span>
                        {selectedLead.osintData?.contactInfo?.phones?.map((p: string, i: number) => (
                          p !== selectedLead.phone && <span key={i} className="text-brand-300 text-xs">{p}</span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-brand-800/30">
                        <span className="text-brand-500 font-medium text-xs">Email</span>
                        <span className="text-white font-bold text-sm truncate">{selectedLead.email || 'N/A'}</span>
                        {selectedLead.osintData?.contactInfo?.emails?.map((e: string, i: number) => (
                          e !== selectedLead.email && <span key={i} className="text-brand-300 text-xs truncate">{e}</span>
                        ))}
                      </div>
                      {(selectedLead.osintData?.contactInfo?.ownerName || selectedLead.last_outreach_attempt) && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-brand-800/30">
                          {selectedLead.osintData?.contactInfo?.ownerName && (
                            <>
                              <span className="text-brand-500 font-medium text-xs">Potential Owner</span>
                              <span className="text-white font-bold text-sm">{selectedLead.osintData.contactInfo.ownerName}</span>
                            </>
                          )}
                          {selectedLead.last_outreach_attempt && (
                            <>
                              <span className="text-brand-500 font-medium text-xs mt-2">Last Outreach Attempt</span>
                              <span className="text-brand-300 font-bold text-[10px] uppercase tracking-widest">
                                {selectedLead.last_outreach_attempt?.toDate ? selectedLead.last_outreach_attempt.toDate().toLocaleString() : 'N/A'}
                              </span>
                            </>
                          )}
                          {selectedLead.previewUrl && (
                            <div className="mt-4 pt-4 border-t border-brand-800/30">
                              <a 
                                href={selectedLead.previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-bold text-xs transition-all shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.3)]"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Live Preview
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedLead.osintData && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-3 bg-white rounded-full" />
                      OSINT Intelligence
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30 space-y-4">
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Social Footprint</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedLead.osintData.socialMedia.facebook && (
                            <a href={selectedLead.osintData.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all">
                              <Facebook className="w-5 h-5" />
                            </a>
                          )}
                          {selectedLead.osintData.socialMedia.instagram && (
                            <a href={selectedLead.osintData.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all">
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                          {selectedLead.osintData.socialMedia.linkedin && (
                            <a href={selectedLead.osintData.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all">
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                          {selectedLead.osintData.socialMedia.twitter && (
                            <a href={selectedLead.osintData.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all">
                              <Twitter className="w-5 h-5" />
                            </a>
                          )}
                          {selectedLead.osintData.socialMedia.youtube && (
                            <a href={selectedLead.osintData.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition-all">
                              <Youtube className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30 space-y-4">
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Public Reputation</p>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-2xl font-display font-bold text-white leading-none">{selectedLead.osintData.businessDetails.rating || 'N/A'}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("w-2.5 h-2.5", s <= (selectedLead.osintData.businessDetails.rating || 0) ? "text-white fill-white" : "text-brand-800")} />
                              ))}
                            </div>
                          </div>
                          <div className="w-px h-8 bg-brand-800/30" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">{selectedLead.osintData.businessDetails.reviewCount || 0}</span>
                            <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest mt-1">Reviews</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30 space-y-4">
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Company Stats</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-brand-400">Founded:</span>
                            <span className="text-white font-bold">{selectedLead.osintData.businessDetails.yearFounded || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-brand-400">Employees:</span>
                            <span className="text-white font-bold">{selectedLead.osintData.businessDetails.employeeCount || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-brand-950/50 p-6 rounded-3xl border border-brand-800/30">
                      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3">Intelligence Summary</p>
                      <p className="text-brand-300 text-sm leading-relaxed italic">"{selectedLead.osintData.summary}"</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-3 bg-white rounded-full" />
                      Autonomous Campaign
                    </h4>
                    {selectedLead.offerPrice && (
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none mb-1">Setup Offer</span>
                          <span className="text-lg font-display font-bold text-white leading-none">€{selectedLead.offerPrice}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none mb-1">Monthly</span>
                          <span className="text-lg font-display font-bold text-white leading-none">€{selectedLead.subscriptionPrice}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedLead.generatedHtml ? (
                    <div className="space-y-6">
                      <div className="bg-brand-950/80 border border-brand-800/50 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/50" />
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <Globe className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-lg tracking-tight">AI Website Generated</p>
                            <p className="text-brand-500 text-sm mt-1">Design Archetype: <span className="text-brand-300 font-bold uppercase tracking-widest text-[10px]">{selectedLead.designArchetype || 'Custom'}</span></p>
                          </div>
                          <button 
                            onClick={() => setPreviewHtml(selectedLead.generatedHtml)}
                            className="bg-white text-brand-950 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-brand-100 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                          >
                            Preview Site
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => launchAICampaign(selectedLead)}
                        disabled={isLaunchingCampaign || selectedLead.status === 'outreach_sent' || selectedLead.status === 'processing_campaign'}
                        className="w-full bg-white text-brand-950 hover:bg-brand-100 disabled:bg-brand-900 disabled:text-brand-700 font-bold py-5 px-8 rounded-[24px] transition-all flex items-center justify-center gap-4 shadow-xl shadow-white/5 active:scale-[0.98]"
                      >
                        {isLaunchingCampaign || selectedLead.status === 'processing_campaign' ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Rocket className="w-6 h-6" />
                        )}
                        <div className="flex flex-col items-start">
                          <span className="text-lg tracking-tight leading-none">
                            {selectedLead.status === 'processing_campaign' ? 'AI Processing...' : 'Launch AI Campaign'}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                            {selectedLead.status === 'processing_campaign' ? 'Generating Website & Sending Offer' : 'Generate Website & Send Offer'}
                          </span>
                        </div>
                      </button>
                      
                      {!selectedLead.mockupDescription && (
                        <button 
                          onClick={() => generateMockup(selectedLead)}
                          disabled={isGeneratingMockup}
                          className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-brand-800/50 rounded-[24px] text-brand-600 hover:border-white/50 hover:text-white transition-all font-bold text-sm"
                        >
                          {isGeneratingMockup ? (
                            <Sparkles className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Strategic Mockup
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewHtml && (
          <WebsitePreview 
            html={previewHtml} 
            businessName={selectedLead?.businessName || 'Business'} 
            onClose={() => setPreviewHtml(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
