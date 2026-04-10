import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  TrendingUp, 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Target,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, limit, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { launchCampaign } from '../services/campaignService';
import { Loader2, Rocket, Lightbulb, MapPin, Briefcase } from 'lucide-react';
import { getGlobalStrategy } from '../services/strategyService';
import { runFullSearch } from '../services/prospectorService';

export default function Dashboard() {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualified: 0,
    outreachSent: 0,
    replied: 0,
    closed: 0
  });

  const [workflowStep, setWorkflowStep] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [strategy, setStrategy] = useState<{ niche: string; city: string; reasoning: string } | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setTestStatus('Analyzing global markets...');
    try {
      const res = await getGlobalStrategy();
      setStrategy(res);
      setTestStatus('Strategy generated!');
      setTimeout(() => setTestStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setTestStatus('Failed to generate strategy.');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const runAutonomousCampaign = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestStatus('Starting autonomous mission...');
    
    try {
      // Step 1: Strategy
      setWorkflowStep('AI Decisions');
      let currentStrategy = strategy;
      if (!currentStrategy) {
        setTestStatus('Identifying high-value target...');
        currentStrategy = await getGlobalStrategy();
        setStrategy(currentStrategy);
      }
      setWorkflowData({ strategy: currentStrategy });

      // Step 2: Prospecting
      setWorkflowStep('Scraping');
      setTestStatus(`Scraping ${currentStrategy.niche} in ${currentStrategy.city}...`);
      
      const leads = await runFullSearch(currentStrategy.city, currentStrategy.niche, (msg) => {
        setTestStatus(msg);
      });

      if (leads.length === 0) {
        throw new Error("No qualified leads found for this strategy.");
      }

      setWorkflowData({ strategy: currentStrategy, leads });

      // Step 3: OSINT & Outreach
      setWorkflowStep('Outreach');
      setTestStatus('Initiating outreach sequence...');
      
      const campaignResults = [];
      // Process top 3 leads for the dashboard demo
      for (const lead of leads.slice(0, 3)) {
        try {
          setTestStatus(`Launching campaign for ${lead.businessName}...`);
          const result = await launchCampaign(lead);
          campaignResults.push({ ...lead, ...result, outreachSent: true });
        } catch (e) {
          console.error(`Failed to launch campaign for ${lead.businessName}`, e);
          campaignResults.push({ ...lead, outreachSent: false });
        }
      }

      setWorkflowData({ strategy: currentStrategy, leads, finalCampaign: campaignResults });

      setTestStatus('Mission complete!');
      setTimeout(() => setTestStatus(''), 5000);
    } catch (error: any) {
      console.error(error);
      setTestStatus(error.message || 'Campaign failed.');
    } finally {
      setIsTesting(false);
    }
  };

  const runTestCampaign = async () => {
    if (!auth.currentUser || isTesting) return;
    setIsTesting(true);
    setTestStatus('Seeding test lead...');
    
    try {
      // 1. Seed a lead
      const leadRef = await addDoc(collection(db, 'leads'), {
        businessName: "Test Bakery " + Math.floor(Math.random() * 1000),
        city: "Paris",
        niche: "Bakery",
        address: "10 Rue de la Paix",
        phone: "01 23 45 67 89",
        email: "test@bakery.com",
        status: "qualified",
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid
      });
      
      setTestStatus('Generating website & sending outreach...');
      
      // 2. Launch Campaign
      await launchCampaign({
        id: leadRef.id,
        businessName: "Test Bakery",
        niche: "Bakery",
        city: "Paris",
        email: "test@bakery.com"
      });
      
      setTestStatus('Campaign launched! Go to Inbox to see results.');
      setTimeout(() => setTestStatus(''), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'leads');
      setTestStatus('Test failed. Check console.');
    } finally {
      setIsTesting(false);
    }
  };
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const leadsRef = collection(db, 'leads');
    const q = query(
      leadsRef, 
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'), 
      limit(5)
    );

    const qStats = query(leadsRef, where('uid', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(qStats, (snapshot) => {
      const leads = snapshot.docs.map(doc => doc.data());
      setStats({
        totalLeads: leads.length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        outreachSent: leads.filter(l => l.status === 'outreach_sent').length,
        replied: leads.filter(l => l.status === 'replied').length,
        closed: leads.filter(l => l.status === 'closed').length
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    const unsubscribeRecent = onSnapshot(q, (snapshot) => {
      setRecentLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return () => {
      unsubscribe();
      unsubscribeRecent();
    };
  }, []);

  const statCards = [
    { label: 'Total Prospects', value: stats.totalLeads, icon: Users, color: 'brand-400' },
    { label: 'Qualified Leads', value: stats.qualified, icon: Target, color: 'brand-300' },
    { label: 'Warm Replies', value: stats.replied, icon: Mail, color: 'brand-200' },
    { label: 'Closed Deals', value: stats.closed, icon: CheckCircle, color: 'brand-100' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.3em]">System Active</span>
          </div>
          <h2 className="text-5xl font-display font-bold text-white tracking-tighter">Command Center</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {testStatus && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl"
            >
              <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest animate-pulse">
                {testStatus}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* Strategy Preview Card */}
          <div className="glass rounded-[40px] p-8 border border-white/[0.03] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <Lightbulb className="w-6 h-6 text-white/60" />
                </div>
                <button 
                  onClick={generateStrategy}
                  disabled={isGeneratingStrategy || isTesting}
                  className="text-[10px] font-bold text-brand-400 hover:text-white uppercase tracking-widest disabled:opacity-50"
                >
                  {isGeneratingStrategy ? 'Analyzing...' : 'Refresh Strategy'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold text-white tracking-tight">AI Strategy Insight</h3>
                
                {strategy ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-brand-500" />
                      <span className="text-sm text-white font-medium">{strategy.niche}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      <span className="text-sm text-white font-medium">{strategy.city}</span>
                    </div>
                    <p className="text-xs text-brand-600 leading-relaxed italic">
                      "{strategy.reasoning}"
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-xs text-brand-600 leading-relaxed">
                    Click refresh to identify the highest-opportunity niche and city for your next mission.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Autonomous Engine Control */}
          <div className="glass rounded-[40px] p-8 border border-white/[0.03] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                  <Sparkles className="w-6 h-6 text-brand-400" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-brand-600 uppercase tracking-widest">Engine Status</span>
                  <span className="text-xs font-mono text-white">{isTesting ? 'RUNNING' : 'READY'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white tracking-tight">Autonomous Outreach</h3>
                <p className="text-sm text-brand-500 leading-relaxed">
                  Deploy AI agents to identify niches, scrape leads, and generate custom landing pages automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={runAutonomousCampaign}
                  disabled={isTesting}
                  className="col-span-2 btn-lg btn-accent"
                >
                  {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  {isTesting ? 'Executing Mission...' : 'Launch Campaign'}
                </button>
                <button 
                  onClick={runTestCampaign}
                  disabled={isTesting}
                  className="col-span-2 btn-md btn-secondary"
                >
                  Run Diagnostic Test
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.slice(0, 2).map((stat, i) => (
              <div key={stat.label} className="glass rounded-3xl p-6 border border-white/[0.03]">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-2">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-white tracking-tight">{stat.value}</span>
                  <TrendingUp className="w-3 h-3 text-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow & Activity */}
        <div className="lg:col-span-8 space-y-8">
          {/* Live Workflow Monitor */}
          <div className={cn(
            "glass rounded-[40px] border border-white/[0.03] shadow-2xl overflow-hidden transition-all duration-700",
            workflowStep ? "h-auto opacity-100" : "h-0 opacity-0 pointer-events-none"
          )}>
            <div className="p-8 border-b border-white/[0.02] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-1 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <h3 className="font-display font-bold text-xl text-white tracking-tight">Mission Progress</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Stepper Sidebar */}
              <div className="w-full md:w-64 p-8 border-r border-white/[0.02] space-y-6 bg-black/20">
                {[
                  { id: 'AI Decisions', label: 'Market Analysis', icon: Target },
                  { id: 'Scraping', label: 'Data Extraction', icon: Users },
                  { id: 'OSINT Dashboard', label: 'Intelligence', icon: Sparkles },
                  { id: 'Website Generated', label: 'Asset Creation', icon: Rocket },
                  { id: 'Outreach', label: 'Deployment', icon: Mail },
                ].map((step, i) => {
                  const isActive = workflowStep === step.id;
                  const isPast = i < ['AI Decisions', 'Scraping', 'OSINT Dashboard', 'Website Generated', 'Outreach'].indexOf(workflowStep || '');
                  
                  return (
                    <div key={step.id} className="flex items-center gap-4 group">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500",
                        isActive ? "bg-white border-white text-brand-950 shadow-[0_0_15px_rgba(255,255,255,0.2)]" :
                        isPast ? "bg-white/10 border-white/20 text-brand-400" :
                        "bg-white/[0.02] border-white/[0.05] text-brand-800"
                      )}>
                        {isPast ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-colors",
                        isActive ? "text-white" : "text-brand-700"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 bg-black/40 relative">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                
                <div className="relative z-10 h-full min-h-[400px]">
                  {workflowStep === 'AI Decisions' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Strategic Market Analysis</h4>
                      <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-brand-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold">{workflowData?.strategy?.niche}</p>
                            <p className="text-[10px] text-brand-600 font-mono uppercase tracking-widest">{workflowData?.strategy?.city}</p>
                          </div>
                        </div>
                        <p className="text-sm text-brand-500 leading-relaxed border-t border-white/[0.02] pt-4">
                          {workflowData?.strategy?.reasoning}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {workflowStep === 'Scraping' && (
                    <div className="h-full flex flex-col space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Data Extraction Engine</h4>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-[10px] font-mono text-brand-500 uppercase">Active Streams</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 rounded-3xl bg-black/60 border border-white/5 p-8 font-mono text-xs overflow-y-auto custom-scrollbar shadow-inner relative">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:20px_20px]" />
                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center gap-3 text-brand-600">
                            <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-white">Initializing Playwright Cluster...</span>
                          </div>
                          <div className="flex items-center gap-3 text-brand-600">
                            <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-white">Connecting to Google Maps Grounding Service...</span>
                          </div>
                          {workflowData?.leads?.map((lead: any, i: number) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.2 }}
                              key={i} 
                              className="space-y-2"
                            >
                              <div className="flex items-center gap-3 text-brand-400">
                                <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                <span className="text-brand-400 font-bold">Target Identified:</span>
                                <span className="text-white">{lead.companyName}</span>
                              </div>
                              <div className="flex items-center gap-3 pl-8 text-brand-700">
                                <ArrowUpRight className="w-3 h-3" />
                                <span className="truncate max-w-md">{lead.url}</span>
                              </div>
                              <div className="flex items-center gap-3 pl-8 text-brand-400/70">
                                <CheckCircle className="w-3 h-3" />
                                <span>Extraction Successful</span>
                              </div>
                            </motion.div>
                          ))}
                          {!workflowData?.leads && (
                            <div className="flex items-center gap-3 text-brand-500 animate-pulse">
                              <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                              <span>Scanning local market for opportunities...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {workflowStep === 'OSINT Dashboard' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Intelligence Report: {workflowData?.enrichedLeads?.[0]?.companyName}</h4>
                      <div className="p-6 bg-brand-950/50 border border-brand-500/20 rounded-2xl font-mono text-xs text-brand-300 leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar">
                        {workflowData?.enrichedLeads?.[0]?.osint}
                      </div>
                    </div>
                  )}

                  {workflowStep === 'Website Generated' && (
                    <div className="h-full flex flex-col space-y-4">
                      <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Generated Asset Preview</h4>
                      <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white">
                        <iframe srcDoc={workflowData?.finalCampaign?.[0]?.websiteHtml} className="w-full h-full" title="Generated Website" />
                      </div>
                    </div>
                  )}

                  {workflowStep === 'Outreach' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Mission Summary & Deployment</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {workflowData?.finalCampaign?.map((lead: any, i: number) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={lead.companyName} 
                            className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between"
                          >
                            <div>
                              <p className="text-white font-bold">{lead.companyName}</p>
                              <p className="text-[10px] text-brand-600 font-mono uppercase mt-1">{lead.niche}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                                {lead.outreachSent ? 'OUTREACH SENT' : 'FAILED'}
                              </span>
                              {lead.previewUrl && (
                                <a 
                                  href={lead.previewUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn-icon w-8 h-8 bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:bg-brand-500/40"
                                  title="View Live Preview"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                                <ArrowUpRight className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Intelligence Stream (Recent Activity) */}
          <div className="glass rounded-[40px] overflow-hidden border border-white/[0.03] shadow-2xl">
            <div className="p-8 border-b border-white/[0.02] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-1 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                <h3 className="font-display font-bold text-xl text-white tracking-tight">Intelligence Stream</h3>
              </div>
              <button className="text-[10px] font-bold text-brand-500 hover:text-white uppercase tracking-widest transition-all px-4 py-2 rounded-xl hover:bg-white/[0.03]">
                Full Archive
              </button>
            </div>
            
            <div className="divide-y divide-white/[0.02]">
              {recentLeads.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="w-16 h-16 bg-brand-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/[0.03] animate-pulse-subtle">
                    <Clock className="w-6 h-6 text-brand-700" />
                  </div>
                  <p className="text-brand-600 font-medium text-sm tracking-tight">Awaiting incoming data streams...</p>
                </div>
              ) : (
                recentLeads.map((lead, i) => (
                  <motion.div 
                    key={lead.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-brand-950 rounded-2xl flex items-center justify-center border border-white/[0.03] group-hover:border-white/[0.1] transition-all relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                        <span className="font-display font-bold text-xl text-brand-500 group-hover:text-white transition-all z-10">
                          {lead.businessName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white tracking-tight text-lg group-hover:translate-x-1 transition-transform">{lead.businessName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">{lead.city}</span>
                          <div className="w-1 h-1 bg-brand-800 rounded-full" />
                          <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">{lead.niche}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border transition-all",
                        lead.status === 'replied' ? "bg-brand-500/5 text-brand-300 border-brand-400/10" :
                        lead.status === 'outreach_sent' ? "bg-brand-500/5 text-brand-400 border-brand-400/10" :
                        "bg-brand-500/5 text-brand-500 border-brand-400/10"
                      )}>
                        {lead.status.replace('_', ' ')}
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.03] text-brand-600 group-hover:text-white group-hover:border-white/[0.1] transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
