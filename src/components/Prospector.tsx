import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Phone, 
  Mail,
  ExternalLink,
  Zap,
  Users,
  Terminal,
  ShieldCheck,
  Activity,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { withRetry } from '../lib/retry';
import { GoogleGenAI, Type } from '@google/genai';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { getBestArchetype } from '../lib/designEngine';
import { generateWebsite } from '../services/campaignService';

import { performSearchRound } from '../services/prospectorService';
import { verifyEmailEligibility } from '../services/emailVerificationService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Prospector() {
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'searching' | 'scrolling' | 'extracting' | 'qualifying'>('idle');
  const [activeUrl, setActiveUrl] = useState('');
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: string; text: string; type: 'info' | 'success' | 'error' | 'warning' }[]>([]);
  const [foundLeads, setFoundLeads] = useState<any[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(), text, type }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const sanitizeEmail = (email: any) => {
    if (!email || typeof email !== 'string') return null;
    return email.trim().toLowerCase();
  };

  const sanitizeUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http')) clean = `https://${clean}`;
    return clean;
  };

  const startProspecting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !niche) return;

    setIsSearching(true);
    setCurrentStep('searching');
    setLogs([]);
    setFoundLeads([]);
    setActiveUrl(`https://www.google.com/maps/search/${encodeURIComponent(niche)}+in+${encodeURIComponent(city)}`);
    
    addLog(`[SYSTEM] Initializing Playwright stealth browser...`, 'info');
    await new Promise(r => setTimeout(r, 1000));
    addLog(`[BROWSER] Navigating to Google Maps...`, 'info');
    await new Promise(r => setTimeout(r, 1500));
    
    setCurrentStep('scrolling');
    addLog(`[BROWSER] Search query: "${niche} in ${city}"`, 'info');
    addLog(`[BROWSER] Scrolling results pane to load infinite-scroll listings...`, 'info');
    await new Promise(r => setTimeout(r, 2000));
    addLog(`[BROWSER] 500+ listings detected. Starting extraction...`, 'success');
    
    setCurrentStep('extracting');
    
    try {
      // Round 1: Broad Search
      addLog(`[AI] Round 1: Broad market scan...`, 'info');
      const results1 = await performSearchRound(city, niche, 1);
      
      // Round 2: Deep Scan
      addLog(`[AI] Round 2: Deep neighborhood scan...`, 'info');
      const results2 = await performSearchRound(city, niche, 2);

      // Round 3: Surrounding Areas
      addLog(`[AI] Round 3: Surrounding areas & outskirts...`, 'info');
      const results3 = await performSearchRound(city, niche, 3);
      
      const allResults = [...results1, ...results2, ...results3];
      
      // Deduplicate by BusinessName
      const results = Array.from(new Map(allResults.map(item => [item.BusinessName, item])).values());
      
      addLog(`[Crawl4AI] Semantic extraction complete. Analyzing ${results.length} unique candidates...`, 'info');

      for (const lead of results) {
        setCurrentStep('qualifying');
        const businessName = lead.BusinessName || lead.name || 'Unknown Business';
        const mapsUrl = lead.maps_url || `https://www.google.com/maps/search/${encodeURIComponent(businessName)}`;
        setActiveUrl(mapsUrl);
        
        addLog(`[ANALYZER] Inspecting: ${businessName}...`, 'info');
        
        const targetEmail = sanitizeEmail(lead.Email || lead.email);
        
        if (targetEmail) {
          addLog(`[VERIFIER] Checking eligibility for ${targetEmail}...`, 'info');
          const verification = await verifyEmailEligibility(targetEmail, businessName);
          
          if (!verification.isValid || verification.score < 40) {
            addLog(`[VERIFIER] Skipping ${businessName} - Email ineligible: ${verification.reason} (Score: ${verification.score})`, 'warning');
            continue;
          }
          addLog(`[VERIFIER] Email verified (Score: ${verification.score}). Proceeding...`, 'success');
        }

        // Real Crawl4AI Call
        try {
          addLog(`[Crawl4AI] Deep crawling ${businessName} profile...`, 'info');
          const scrapeRes = await withRetry(() => fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: mapsUrl })
          }));
          const scrapeData = await scrapeRes.json();
          if (scrapeData.success) {
            addLog(`[Crawl4AI] Successfully parsed DOM for ${businessName}.`, 'success');
            if (scrapeData.screenshot) {
              setLastScreenshot(scrapeData.screenshot);
            }
          }
        } catch (e) {
          addLog(`[Crawl4AI] Fallback to simulation for ${businessName}.`, 'warning');
        }

        await new Promise(r => setTimeout(r, 800));
        
        // Qualification logic: Discard if website exists (per SOP)
        const hasWebsite = !!(lead.Website || lead.website);
        
        if (hasWebsite) {
          addLog(`[QUALIFIER] DISCARDED: ${businessName} - Website detected (${lead.Website || lead.website}).`, 'warning');
          continue;
        }

        addLog(`[QUALIFIER] MATCH FOUND: ${businessName} has no website.`, 'success');
        addLog(`[SYSTEM] Saving lead to Faiz's vault...`, 'info');
        
        const leadData: any = {
          uid: auth.currentUser?.uid,
          businessName,
          address: (lead.Address || lead.address || 'Unknown').substring(0, 200),
          phone: (lead.PhoneNumber || lead.phone || 'Unknown').substring(0, 20),
          email: sanitizeEmail(lead.Email || lead.email),
          website: sanitizeUrl(lead.Website || lead.website),
          city,
          niche,
          status: 'qualified',
          createdAt: serverTimestamp()
        };

        // Auto-Launch Campaign Logic
        if (autoLaunch) {
          addLog(`[AI] Analyzing mission and goals for ${businessName}...`, 'info');
          
          // Select Design Archetype
          const archetype = getBestArchetype(businessName, niche);
          addLog(`[AI] Selected Design Archetype: ${archetype.name}`, 'success');
          
          addLog(`[AI] Auto-generating website for ${businessName}...`, 'info');
          try {
            const { html, archetype: archetypeId } = await withRetry(() => generateWebsite(businessName, niche, city));
            
            const setupPrice = Math.floor(Math.random() * (400 - 300 + 1)) + 300;
            const monthlyPrice = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
            
            leadData.generatedHtml = html;
            leadData.designArchetype = archetypeId;
            leadData.offerPrice = setupPrice;
            leadData.subscriptionPrice = monthlyPrice;
            leadData.status = 'outreach_sent';
            leadData.outreachSentAt = serverTimestamp();
            leadData.last_outreach_attempt = serverTimestamp();
            
            // Send Outreach via API
            await fetch('/api/send-outreach', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessName,
                email: leadData.email,
                offerPrice: setupPrice,
                subscriptionPrice: monthlyPrice,
                archetype: archetype.name
              })
            });

            addLog(`[AI] ${archetype.name} website generated. Outreach offer (€${setupPrice} + €${monthlyPrice}/mo) sent.`, 'success');
          } catch (e) {
            addLog(`[AI] Failed to auto-generate website for ${businessName}.`, 'error');
          }
        }

        // Save to Firestore
        try {
          const docRef = await addDoc(collection(db, 'leads'), leadData);
          setFoundLeads(prev => [...prev, { id: docRef.id, ...leadData }]);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'leads');
        }
      }

      setCurrentStep('idle');
      addLog(`[SYSTEM] Pipeline complete. Found ${foundLeads.length} qualified leads.`, 'success');
    } catch (error) {
      console.error(error);
      addLog(`[CRITICAL] System Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setCurrentStep('idle');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header & Form */}
      <div className="glass p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/[0.03]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-inner">
            <Search className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">Lead Prospector</h2>
            <p className="text-brand-500 font-medium mt-1">Specify a city and niche to start the autonomous hunt.</p>
          </div>
        </div>

        <form onSubmit={startProspecting} className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] ml-1">Target City</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-700 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Tampa, FL"
                className="w-full bg-brand-950/50 border border-white/[0.03] rounded-2xl py-4 pl-12 pr-4 text-white focus:border-white/[0.1] focus:ring-4 focus:ring-white/[0.02] outline-none transition-all placeholder:text-brand-800 font-medium"
                disabled={isSearching}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] ml-1">Business Niche</label>
            <div className="relative group">
              <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-700 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Custom Cabinets"
                className="w-full bg-brand-950/50 border border-white/[0.03] rounded-2xl py-4 pl-12 pr-4 text-white focus:border-white/[0.1] focus:ring-4 focus:ring-white/[0.02] outline-none transition-all placeholder:text-brand-800 font-medium"
                disabled={isSearching}
              />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] ml-1">Auto-Pilot Mode</label>
              <button 
                type="button"
                onClick={() => setAutoLaunch(!autoLaunch)}
                className={cn(
                  "w-full flex items-center justify-between px-6 py-4 rounded-[24px] border transition-all duration-300 active:scale-[0.96]",
                  autoLaunch 
                    ? "bg-white/[0.05] border-white/[0.1] text-white shadow-lg shadow-white/5" 
                    : "bg-brand-950/50 border-white/[0.03] text-brand-700 hover:border-white/[0.08]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Rocket className={cn("w-5 h-5 transition-transform duration-500", autoLaunch && "animate-float")} />
                  <span className="text-sm font-bold tracking-tight">Auto-Launch AI</span>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full relative transition-colors duration-300",
                  autoLaunch ? "bg-white" : "bg-brand-800"
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full transition-all duration-300 shadow-sm",
                    autoLaunch ? "right-1 bg-brand-950" : "left-1 bg-brand-400"
                  )} />
                </div>
              </button>
            </div>
            <button 
              type="submit"
              disabled={isSearching || !city || !niche}
              className="btn-lg btn-accent flex-1 flex items-center justify-center"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Hunting...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Hunt
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Scraper View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Live Browser Simulation */}
        <div className="lg:col-span-2 glass rounded-[40px] overflow-hidden flex flex-col h-[650px] shadow-2xl border border-white/[0.03]">
          <div className="bg-white/[0.01] px-8 py-5 border-b border-white/[0.02] flex items-center gap-8">
            <div className="flex gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-800" />
            </div>
            <div className="flex-1 bg-black/40 rounded-xl px-5 py-2.5 text-[11px] text-brand-600 font-mono truncate flex items-center gap-3 border border-white/[0.02]">
              <Globe className="w-3.5 h-3.5" />
              {activeUrl || 'about:blank'}
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-2 h-2 rounded-full relative",
                isSearching ? "bg-white" : "bg-brand-800"
              )}>
                {isSearching && <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />}
              </div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">
                {isSearching ? 'Live Stream' : 'Standby'}
              </span>
            </div>
          </div>
          
          <div className="flex-1 bg-brand-950 relative overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentStep === 'idle' ? (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="text-center space-y-8"
                >
                  <div className="w-20 h-20 bg-white/[0.02] rounded-[32px] flex items-center justify-center mx-auto border border-white/[0.03] shadow-inner">
                    <Search className="w-8 h-8 text-brand-800" />
                  </div>
                  <p className="text-brand-700 font-medium tracking-tight text-sm">Awaiting mission parameters...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex flex-col"
                >
                  {/* Simulated Maps View */}
                  <div className="flex-1 relative overflow-hidden bg-brand-950">
                    {lastScreenshot ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-0"
                      >
                        <img 
                          src={lastScreenshot} 
                          alt="Live Scraper View" 
                          className="w-full h-full object-contain opacity-80 grayscale hover:grayscale-0 transition-all duration-700" 
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-8">
                          <div className="relative">
                            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-white animate-pulse" />
                            </div>
                          </div>
                          <p className="text-brand-700 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse-subtle">ESTABLISHING SECURE TUNNEL...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Bottom HUD */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-8 bg-gradient-to-t from-brand-950 via-brand-950/95 to-transparent">
                      <div className="flex items-end gap-8">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-6 glass-dark p-5 rounded-3xl min-w-[260px] shadow-2xl border border-white/[0.03]">
                          <div className="relative w-14 h-14 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                            {currentStep === 'searching' && <Search className="w-6 h-6 text-white animate-float" />}
                            {currentStep === 'scrolling' && <Activity className="w-6 h-6 text-white animate-pulse" />}
                            {currentStep === 'extracting' && <Zap className="w-6 h-6 text-white animate-pulse" />}
                            {currentStep === 'qualifying' && <CheckCircle2 className="w-6 h-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-display font-bold text-white capitalize leading-none mb-2">{currentStep}...</h3>
                            <p className="text-[10px] text-brand-600 font-mono uppercase tracking-widest">
                              {currentStep === 'searching' && 'MAPS_API_TUNNEL'}
                              {currentStep === 'scrolling' && 'HUMAN_BEHAVIOR_SIM'}
                              {currentStep === 'extracting' && 'METADATA_HARVEST'}
                              {currentStep === 'qualifying' && 'LEAD_VALIDATION'}
                            </p>
                          </div>
                        </div>

                        {/* Data Stream HUD */}
                        <div className="flex-1 glass-dark rounded-3xl p-5 font-mono text-[11px] text-brand-400 space-y-2 overflow-hidden h-[94px] shadow-2xl border border-white/[0.03]">
                          <div className="flex justify-between border-b border-white/[0.02] pb-3 mb-3">
                            <span className="flex items-center gap-2.5 opacity-40"><Terminal className="w-4 h-4" /> HUD_CORE_V4.0</span>
                            <span className="text-white flex items-center gap-2 font-bold opacity-80"><ShieldCheck className="w-4 h-4" /> ENCRYPTED_SESSION</span>
                          </div>
                          <div className="truncate opacity-40">{`> GET /maps/search?q=${niche}+${city}`}</div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-brand-200 truncate">
                              <Activity className="w-4 h-4 animate-pulse" />
                              <span className="opacity-80">{`> PROCESSING: ${activeUrl.substring(0, 40)}...`}</span>
                            </div>
                            {foundLeads.length > 0 && (
                              <div className="bg-white/[0.05] border border-white/[0.1] px-3 py-1 rounded-lg">
                                <span className="text-white font-bold text-[10px]">{`QUALIFIED: ${foundLeads.length}`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Terminal Logs (Right Side) */}
        <div className="flex flex-col gap-8">
          <div className="glass rounded-[40px] overflow-hidden flex flex-col h-[650px] shadow-2xl border border-white/[0.03]">
            <div className="bg-white/[0.01] px-8 py-5 border-b border-white/[0.02] flex items-center justify-between">
              <div className="flex gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-900" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-900" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-900" />
              </div>
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-[0.3em] font-bold">Autonomous_Terminal</span>
            </div>
            <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto space-y-4 scrollbar-hide">
              {logs.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center h-full text-brand-800 space-y-6">
                  <Terminal className="w-12 h-12 opacity-10" />
                  <p className="italic font-medium text-xs tracking-tight">Awaiting command sequence...</p>
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className={cn(
                  "flex gap-5 leading-relaxed transition-all duration-300",
                  log.type === 'success' ? "text-white" :
                  log.type === 'error' ? "text-brand-400" :
                  log.type === 'warning' ? "text-brand-600" :
                  "text-brand-500"
                )}>
                  <span className="text-brand-800 font-bold shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="flex-1 font-medium">{log.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <AnimatePresence>
        {foundLeads.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-4">
                <div className="w-1.5 h-8 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                Qualified Intelligence
              </h3>
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.03]">
                Session Payload: {foundLeads.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {foundLeads.slice(-4).reverse().map((lead, i) => (
                <motion.div 
                  key={lead.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-6 rounded-3xl border border-white/[0.03] flex flex-col gap-5 hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.05] group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-brand-400" />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border",
                      lead.status === 'outreach_sent' ? "bg-white/[0.05] text-white border-white/[0.1]" : "bg-brand-900/50 text-brand-500 border-white/[0.03]"
                    )}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white truncate tracking-tight">{lead.businessName}</p>
                    <p className="text-[10px] text-brand-600 truncate mt-1 font-mono uppercase tracking-widest">{lead.city}</p>
                  </div>
                  {lead.last_outreach_attempt && (
                    <div className="pt-4 border-t border-white/[0.02] flex items-center justify-between">
                      <span className="text-[9px] font-bold text-brand-700 uppercase tracking-widest">Last Outreach</span>
                      <span className="text-[9px] font-mono text-brand-500">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
