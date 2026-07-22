import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Clock,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  Rocket,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase.ts';
import { cn } from '../lib/utils.ts';
import { launchCampaign } from '../services/campaignService.ts';
import { runFullSearch } from '../services/prospectorService.ts';
import { getGlobalStrategy } from '../services/strategyService.ts';

export default function Dashboard() {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualified: 0,
    outreachSent: 0,
    replied: 0,
    closed: 0,
  });

  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');
  const [consoleLogs, setConsoleLogs] = useState<
    { id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }[]
  >([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addConsoleLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        text,
        type,
      },
    ]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleDemoChange = () => {
      setDemoMode(localStorage.getItem('demo_mode') === 'true');
    };
    window.addEventListener('demoModeChanged', handleDemoChange);
    return () => window.removeEventListener('demoModeChanged', handleDemoChange);
  }, []);

  const [workflowStep, setWorkflowStep] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [strategy, setStrategy] = useState<{
    niche: string;
    city: string;
    reasoning: string;
  } | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setTestStatus('Analyzing global markets...');
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600));
        setStrategy({
          niche: 'Boutique Patisseries',
          city: 'Paris, France',
          reasoning:
            'High density of premium artisan bakeries operating on legacy single-page websites with missing click-to-order and custom booking engines.',
        });
        setTestStatus('Strategy generated!');
        setTimeout(() => setTestStatus(''), 3000);
        return;
      }
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
    if (isTesting) {
      return;
    }
    setIsTesting(true);
    setTestStatus('Starting autonomous mission...');

    try {
      if (demoMode) {
        setConsoleLogs([]);

        // 1. AI Decisions
        setWorkflowStep('AI Decisions');
        setTestStatus('Initializing Strategic Market Analyzer...');
        addConsoleLog('Initializing AI Global Strategic Analyzer...', 'info');
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog('Querying opportunity indexes across 15 high-growth sectors...', 'info');
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog('Analyzing local digital footprint density in Paris, France...', 'info');
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Target niche identified: "Boutique Patisseries" has digital saturation < 15% with high rating matrix.',
          'success',
        );
        const simStrategy = {
          niche: 'Boutique Patisseries',
          city: 'Paris',
          reasoning:
            'High density of premium artisan bakeries operating on legacy single-page websites with missing click-to-order and custom booking engines.',
        };
        setStrategy(simStrategy);
        setWorkflowData({ strategy: simStrategy });
        await new Promise((r) => setTimeout(r, 1500));

        // 2. Scraping
        setWorkflowStep('Scraping');
        setTestStatus('Spawning Playwright headless crawler...');
        addConsoleLog('Spawning stealth Playwright headless crawler...', 'info');
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog(
          'Rotating user-agents and establishing residential proxy pool (node: paris-residential-04)...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Opening active Maps search bridge for: "Boutique Patisseries in Paris"...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          '[SCROLLER] Viewport coordinates: scrollY=2400px (18 results matched in active DOM)...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          '[SCROLLER] Viewport coordinates: scrollY=5800px (45 results loaded in infinite scroll pool)...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog(
          '[Crawl4AI] Parsing semantic structures and filtering out functional domains...',
          'info',
        );
        const simLeads = [
          {
            id: 'sim-lead-1',
            businessName: 'Maison de la Brioche',
            city: 'Paris',
            niche: 'Boutique Patisseries',
            website: 'No website',
            email: 'contact@briochemaison.fr',
          },
          {
            id: 'sim-lead-2',
            businessName: "L'Atelier du Croissant",
            city: 'Paris',
            niche: 'Boutique Patisseries',
            website: 'No website',
            email: 'info@ateliercroissant.com',
          },
        ];
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Match Found: "Maison de la Brioche" - Status: Qualified (Zero digital web trace detected)',
          'success',
        );
        setWorkflowData({ strategy: simStrategy, leads: [simLeads[0]] });
        await new Promise((r) => setTimeout(r, 1500));

        addConsoleLog(
          'Match Found: "L\'Atelier du Croissant" - Status: Qualified (Zero digital web trace detected)',
          'success',
        );
        setWorkflowData({ strategy: simStrategy, leads: simLeads });
        await new Promise((r) => setTimeout(r, 1800));

        // 3. OSINT Dashboard
        setWorkflowStep('OSINT Dashboard');
        setTestStatus('Gathering intelligence & verifying contact parameters...');
        addConsoleLog('Launching deep metadata & OSINT profile aggregator...', 'info');
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog('Querying Google Places public API metadata for registrants...', 'info');
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog('Analyzing review sentiment and core brand identity attributes...', 'info');
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Running active SMTP mailbox verification handshake for "contact@briochemaison.fr"...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          '[SMTP] Handshake success (250 OK). Mailbox is qualified, active, and responsive.',
          'success',
        );
        const osintReport =
          '[Crawl4AI OSINT REPORT]\n- Contact Email: contact@briochemaison.fr\n- Registry Phone: +33 1 42 68 53 10\n- Social handle: @maisonbrioche_paris\n- Rating: 4.8 stars (120 reviews)\n- Primary Paint: Deep Burgundy\n- Status: Qualified for instant mockup delivery.';
        setWorkflowData({
          strategy: simStrategy,
          leads: simLeads,
          enrichedLeads: [
            {
              businessName: 'Maison de la Brioche',
              osint: osintReport,
            },
          ],
        });
        addConsoleLog('OSINT Intelligence report compiled for "Maison de la Brioche".', 'success');
        await new Promise((r) => setTimeout(r, 2000));

        // 4. Website Generated
        setWorkflowStep('Website Generated');
        setTestStatus('Synthesizing bespoke layout mockup...');
        addConsoleLog('Invoking Gemini design engine with brand context...', 'info');
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog(
          'Selected archetype: Luxury Artisan Elegance (Burnt Orange & Gold details)...',
          'success',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Compiling styling templates and responsive web layouts with Tailwind CSS...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Injecting click-to-order system modules and local Parisian location metadata...',
          'info',
        );
        const simHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body className="bg-stone-50 text-stone-900 font-sans min-h-screen flex flex-col justify-between">
            <header className="p-6 border-b border-stone-200 flex justify-between items-center max-w-5xl mx-auto w-full">
              <span className="text-xl font-bold tracking-tight text-amber-950">Maison de la Brioche</span>
              <span className="px-4 py-1.5 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold">Artisan Bakery</span>
            </header>
            <main className="max-w-3xl mx-auto text-center px-6 py-20 space-y-8">
              <h1 className="text-5xl font-black text-amber-950 leading-none">Fresh Artisan Brioches, Delivered Daily to Your Doorstep.</h1>
              <p className="text-stone-600 text-lg">Indulge in authentic French patisserie baked with organic flour and Normandy butter. Click below to secure your daily morning delivery subscription.</p>
              <button className="bg-amber-950 text-white px-8 py-4 rounded-xl font-bold hover:bg-amber-900 transition-colors shadow-lg shadow-amber-950/20">Reserve Morning Box</button>
            </main>
            <footer className="p-6 border-t border-stone-100 text-center text-xs text-stone-400">
              © 2026 Maison de la Brioche. All rights reserved. 10 Rue de la Paix, Paris.
            </footer>
          </body>
          </html>
        `;
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Web mockup generation complete! Live interactive sandbox compiled.',
          'success',
        );
        setWorkflowData((prev) => ({
          ...prev,
          finalCampaign: [
            {
              ...simLeads[0],
              websiteHtml: simHtml,
              outreachSent: true,
              previewUrl: '#',
            },
          ],
        }));
        await new Promise((r) => setTimeout(r, 2000));

        // 5. Outreach & final state
        setWorkflowStep('Outreach');
        setTestStatus('Deploying personalized campaign via SMTP...');
        addConsoleLog('Initializing SMTP mailer dispatcher pipeline...', 'info');
        await new Promise((r) => setTimeout(r, 1000));

        addConsoleLog(
          'Formulating high-conversion subject line and visual mockup deck attachment...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog('Connecting to outbound gateway servers (smtp.gcp.leadfoundry)...', 'info');
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          'Dispatching custom campaign offer to contact@briochemaison.fr (Rate: €349 Setup + €19/mo)...',
          'info',
        );
        await new Promise((r) => setTimeout(r, 1200));

        addConsoleLog(
          '[MAILER] 250 OK: Outreach successfully dispatched! Message-ID: <f0293da82@leadfoundry>',
          'success',
        );
        addConsoleLog('Recording campaign details and synchronizing local database...', 'info');

        // Add to Firestore to make the list lively
        if (auth.currentUser) {
          await addDoc(collection(db, 'leads'), {
            uid: auth.currentUser.uid,
            businessName: 'Maison de la Brioche',
            city: 'Paris',
            niche: 'Boutique Patisseries',
            address: '10 Rue de la Paix, Paris',
            phone: '+33 1 42 68 53 10',
            email: 'contact@briochemaison.fr',
            website: null,
            status: 'outreach_sent',
            designArchetype: 'luxury',
            offerPrice: 349,
            subscriptionPrice: 19,
            createdAt: serverTimestamp(),
            generatedHtml: simHtml,
          });
        }

        addConsoleLog('Campaign execution completed! Systems returned to standby.', 'success');
        setTestStatus('Campaign successfully launched!');
        setTimeout(() => {
          setTestStatus('');
          setIsTesting(false);
        }, 3000);
        return;
      }

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
        throw new Error('No qualified leads found for this strategy.');
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
    if (!auth.currentUser || isTesting) {
      return;
    }
    setIsTesting(true);
    setTestStatus('Seeding test lead...');

    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600));
        setTestStatus('Generating website & sending outreach...');
        await new Promise((r) => setTimeout(r, 800));
        await addDoc(collection(db, 'leads'), {
          uid: auth.currentUser.uid,
          businessName: `Test Bakery ${Math.floor(Math.random() * 1000)}`,
          city: 'Paris',
          niche: 'Bakery',
          address: '10 Rue de la Paix',
          phone: '01 23 45 67 89',
          email: 'test@bakery.com',
          status: 'outreach_sent',
          createdAt: serverTimestamp(),
          designArchetype: 'minimalist',
          offerPrice: 299,
          subscriptionPrice: 9,
          generatedHtml: `<html><body className="bg-neutral-50 flex items-center justify-center h-screen"><h1 className="text-2xl font-bold">Parisian Delights</h1></body></html>`,
        });
        setTestStatus('Campaign launched! Go to Inbox to see results.');
        setTimeout(() => setTestStatus(''), 5000);
        return;
      }

      // 1. Seed a lead
      const leadRef = await addDoc(collection(db, 'leads'), {
        businessName: `Test Bakery ${Math.floor(Math.random() * 1000)}`,
        city: 'Paris',
        niche: 'Bakery',
        address: '10 Rue de la Paix',
        phone: '01 23 45 67 89',
        email: 'test@bakery.com',
        status: 'qualified',
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
      });

      setTestStatus('Generating website & sending outreach...');

      // 2. Launch Campaign
      await launchCampaign({
        id: leadRef.id,
        businessName: 'Test Bakery',
        niche: 'Bakery',
        city: 'Paris',
        email: 'test@bakery.com',
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
  const [isStreamCollapsed, setIsStreamCollapsed] = useState(true);

  useEffect(() => {
    (window as any).setCampaignActive?.('dashboard-campaign', isTesting || isGeneratingStrategy);
    return () => {
      (window as any).setCampaignActive?.('dashboard-campaign', false);
    };
  }, [isTesting, isGeneratingStrategy]);

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }
    const leadsRef = collection(db, 'leads');
    const q = query(
      leadsRef,
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5),
    );

    const qStats = query(leadsRef, where('uid', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(
      qStats,
      (snapshot) => {
        if (demoMode) {
          setStats({
            totalLeads: 142,
            qualified: 87,
            outreachSent: 55,
            replied: 24,
            closed: 9,
          });
          return;
        }
        const leads = snapshot.docs.map((doc) => doc.data());
        setStats({
          totalLeads: leads.length,
          qualified: leads.filter((l) => l.status === 'qualified').length,
          outreachSent: leads.filter((l) => l.status === 'outreach_sent').length,
          replied: leads.filter((l) => l.status === 'replied').length,
          closed: leads.filter((l) => l.status === 'closed').length,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leads');
      },
    );

    const unsubscribeRecent = onSnapshot(
      q,
      (snapshot) => {
        if (demoMode) {
          // Prepend some high-quality active presentation-ready leads alongside any dynamic db leads
          const dbLeads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const presentationLeads = [
            {
              id: 'demo-lead-1',
              businessName: 'Tampa Custom Cabinetry',
              city: 'Tampa, FL',
              niche: 'Custom Cabinets',
              status: 'outreach_sent',
              offerPrice: 380,
              subscriptionPrice: 19,
              createdAt: { toDate: () => new Date() },
            },
            {
              id: 'demo-lead-2',
              businessName: 'Granite Elegance',
              city: 'Tampa, FL',
              niche: 'Kitchen Granite',
              status: 'replied',
              offerPrice: 420,
              subscriptionPrice: 29,
              createdAt: { toDate: () => new Date(Date.now() - 3_600_000) },
            },
            {
              id: 'demo-lead-3',
              businessName: 'Metro Plumbing Service',
              city: 'Tampa, FL',
              niche: 'Plumber',
              status: 'closed',
              offerPrice: 299,
              subscriptionPrice: 19,
              createdAt: { toDate: () => new Date(Date.now() - 7_200_000) },
            },
          ];
          setRecentLeads([...presentationLeads, ...dbLeads].slice(0, 5));
          return;
        }
        setRecentLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leads');
      },
    );

    return () => {
      unsubscribe();
      unsubscribeRecent();
    };
  }, [demoMode]);

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
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.3em]">
              System Active
            </span>
          </div>
          <h2 className="text-5xl font-display font-bold text-white tracking-tighter">
            Command Center
          </h2>
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
          <div className="glass rounded-2xl p-6 border border-white/[0.03] shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <Lightbulb className="w-5 h-5 text-white/60" />
                </div>
                <button
                  onClick={generateStrategy}
                  disabled={isGeneratingStrategy || isTesting}
                  className="text-[10px] font-bold text-brand-400 hover:text-white uppercase tracking-widest disabled:opacity-50 h-10 w-[290px]"
                >
                  {isGeneratingStrategy ? 'Analyzing...' : 'Refresh Strategy'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  AI Strategy Insight
                </h3>

                {strategy ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
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
                    Click refresh to identify the highest-opportunity niche and city for your next
                    mission.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Autonomous Engine Control */}
          <div className="glass rounded-2xl p-6 border border-white/[0.03] shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                    Engine Status
                  </span>
                  <span className="text-xs font-mono text-white">
                    {isTesting ? 'RUNNING' : 'READY'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  Autonomous Outreach
                </h3>
                <p className="text-xs text-brand-500 leading-relaxed">
                  Deploy AI agents to identify niches, scrape leads, and generate custom landing
                  pages automatically.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={runAutonomousCampaign}
                  disabled={isTesting}
                  className="w-full btn-md btn-accent flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Rocket className="w-4 h-4 shrink-0" />
                  )}
                  {isTesting ? 'Executing Mission...' : 'Launch Campaign'}
                </button>
                <button
                  onClick={runTestCampaign}
                  disabled={isTesting}
                  className="w-full btn-md btn-secondary flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  Run Diagnostic Test
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.slice(0, 2).map((stat, _i) => (
              <div key={stat.label} className="glass rounded-xl p-5 border border-white/[0.03]">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-2">
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-bold text-white tracking-tight">
                    {stat.value}
                  </span>
                  <TrendingUp className="w-3 h-3 text-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow & Activity */}
        <div className="lg:col-span-8 space-y-8">
          {/* Live Workflow Monitor */}
          <div
            className={cn(
              'glass rounded-2xl border border-white/[0.03] shadow-2xl overflow-hidden transition-all duration-700',
              workflowStep ? 'h-auto opacity-100' : 'h-0 opacity-0 pointer-events-none',
            )}
          >
            <div className="p-6 border-b border-white/[0.02] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-1 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <h3 className="font-display font-bold text-lg text-white tracking-tight">
                  Mission Progress
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isTesting
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold uppercase tracking-widest',
                    isTesting ? 'text-amber-400' : 'text-emerald-400',
                  )}
                >
                  {isTesting ? 'Active Execution' : 'Execution Completed'}
                </span>
              </div>
            </div>

            {/* Horizontal Stepper Ribbon */}
            <div className="p-6 border-b border-white/[0.02] bg-black/10">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'AI Decisions', label: 'Market Analysis', icon: Target },
                  { id: 'Scraping', label: 'Data Extraction', icon: Users },
                  { id: 'OSINT Dashboard', label: 'Intelligence', icon: Sparkles },
                  { id: 'Website Generated', label: 'Asset Creation', icon: Rocket },
                  { id: 'Outreach', label: 'Deployment', icon: Mail },
                ].map((step, i) => {
                  const isActive = workflowStep === step.id;
                  const isPast =
                    i <
                    [
                      'AI Decisions',
                      'Scraping',
                      'OSINT Dashboard',
                      'Website Generated',
                      'Outreach',
                    ].indexOf(workflowStep || '');
                  const isCompleted = !isTesting && Boolean(workflowStep);
                  const isStepDone = isCompleted && (isActive || isPast);

                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center gap-2 text-center relative"
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-500 z-10',
                          isStepDone
                            ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                            : isActive
                              ? 'bg-amber-400 border-amber-400 text-brand-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                              : isPast
                                ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
                                : 'bg-white/[0.02] border-white/[0.05] text-brand-800',
                        )}
                      >
                        {isPast || isStepDone ? (
                          <CheckCircle className="w-4.5 h-4.5" />
                        ) : (
                          <step.icon className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[9px] font-mono font-bold uppercase tracking-widest transition-colors hidden sm:block',
                          isStepDone
                            ? 'text-emerald-400'
                            : isActive
                              ? 'text-amber-400'
                              : isPast
                                ? 'text-brand-500'
                                : 'text-brand-700',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              {/* Left Side: Always-Visible Telemetry Terminal (Center of Focus, 7/12 width) */}
              <div className="lg:col-span-7 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                      AI Pipeline Logs
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-brand-600 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.03]">
                    CORE_V4_RUNNING
                  </span>
                </div>

                <div className="flex-1 bg-black/80 border border-white/5 rounded-xl p-5 font-mono text-[11px] overflow-y-auto custom-scrollbar shadow-2xl relative space-y-2">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.01] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:16px_16px]" />
                  <div className="relative z-10 space-y-2">
                    {consoleLogs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          'flex items-start gap-2.5 leading-relaxed',
                          log.type === 'success'
                            ? 'text-emerald-400 font-medium'
                            : log.type === 'warn'
                              ? 'text-brand-500'
                              : log.type === 'error'
                                ? 'text-red-400 font-bold'
                                : 'text-zinc-300',
                        )}
                      >
                        <span className="text-brand-700 select-none">[{log.time}]</span>
                        <span className="flex-1 whitespace-pre-line">{log.text}</span>
                      </div>
                    ))}
                    {consoleLogs.length === 0 && (
                      <div className="text-brand-800 italic">
                        Awaiting autonomous sequence trigger...
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>

              {/* Right Side: Active Payload Preview Panel (Supporting Visuals, 5/12 width) */}
              <div className="lg:col-span-5 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-400" />
                    <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-wider">
                      Active Payload
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-brand-600 uppercase">
                    {workflowStep}
                  </span>
                </div>

                <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-xl p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                  <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0">
                    {workflowStep === 'AI Decisions' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">
                          Market Strategy
                        </h4>
                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-3">
                          <div className="flex items-center gap-3">
                            <Target className="w-4 h-4 text-brand-400" />
                            <div>
                              <p className="text-white text-xs font-bold leading-none">
                                {workflowData?.strategy?.niche}
                              </p>
                              <p className="text-[9px] text-brand-600 font-mono uppercase tracking-widest mt-1">
                                {workflowData?.strategy?.city}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-brand-500 leading-relaxed border-t border-white/[0.02] pt-2 italic">
                            "{workflowData?.strategy?.reasoning}"
                          </p>
                        </div>
                      </div>
                    )}

                    {workflowStep === 'Scraping' && (
                      <div className="space-y-3 h-full flex flex-col justify-start">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">
                          Extracted Prospects
                        </h4>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[300px] pr-1">
                          {workflowData?.leads?.map((lead: any, i: number) => (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={lead.id || `lead-${i}`}
                              className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 bg-brand-500/10 rounded-lg flex items-center justify-center border border-brand-500/20 shrink-0">
                                  <Users className="w-4 h-4 text-brand-400" />
                                </div>
                                <div className="truncate">
                                  <p className="text-white text-xs font-bold truncate">
                                    {lead.businessName}
                                  </p>
                                  <p className="text-[9px] text-brand-600 font-mono uppercase mt-0.5">
                                    {lead.city}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                NO WEBSITE
                              </span>
                            </motion.div>
                          ))}
                          {(!workflowData?.leads || workflowData.leads.length === 0) && (
                            <div className="py-12 text-center">
                              <Loader2 className="w-6 h-6 text-brand-700 animate-spin mx-auto mb-2" />
                              <p className="text-xs text-brand-500">Querying Maps API...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {workflowStep === 'OSINT Dashboard' && (
                      <div className="space-y-3 h-full flex flex-col justify-start">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest truncate">
                          Intelligence Report
                        </h4>
                        <div className="p-4 bg-brand-950/40 border border-brand-500/15 rounded-xl font-mono text-[10px] text-brand-300 leading-relaxed overflow-y-auto custom-scrollbar max-h-[280px]">
                          {workflowData?.enrichedLeads?.[0]?.osint}
                        </div>
                      </div>
                    )}

                    {workflowStep === 'Website Generated' && (
                      <div className="h-full flex flex-col space-y-3">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">
                          Asset Preview
                        </h4>
                        <div className="flex-1 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-white">
                          <iframe
                            srcDoc={workflowData?.finalCampaign?.[0]?.websiteHtml}
                            className="w-full h-full"
                            title="Generated Website"
                          />
                        </div>
                      </div>
                    )}

                    {workflowStep === 'Outreach' && (
                      <div className="space-y-3 h-full flex flex-col justify-start">
                        <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">
                          Campaign Deployment
                        </h4>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[300px]">
                          {workflowData?.finalCampaign?.map((lead: any, i: number) => (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={lead.id || `campaign-${i}`}
                              className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">
                                  {lead.businessName}
                                </p>
                                <p className="text-[9px] text-brand-600 font-mono uppercase mt-0.5">
                                  {lead.niche}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[8px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                                  SENT
                                </span>
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
          </div>

          {/* Collapsible Intelligence Stream (Recent Activity) */}
          <div className="glass rounded-2xl overflow-hidden border border-white/[0.03] shadow-xl">
            <button
              onClick={() => setIsStreamCollapsed(!isStreamCollapsed)}
              className="w-full text-left p-6 border-b border-white/[0.02] flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-1 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display font-bold text-xl text-white tracking-tight">
                    Intelligence Stream
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-brand-500 bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                    {recentLeads.length} Records
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-brand-600 tracking-wider font-bold uppercase hidden sm:inline">
                  {isStreamCollapsed ? 'Click to expand' : 'Click to collapse'}
                </span>
                <motion.div
                  animate={{ rotate: isStreamCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.03] flex items-center justify-center text-brand-500 group-hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </div>
            </button>

            <motion.div
              initial={false}
              animate={{
                height: isStreamCollapsed ? 0 : 'auto',
                opacity: isStreamCollapsed ? 0 : 1,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="divide-y divide-white/[0.02]">
                {recentLeads.length === 0 ? (
                  <div className="p-24 text-center">
                    <div className="w-16 h-16 bg-brand-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/[0.03] animate-pulse-subtle">
                      <Clock className="w-6 h-6 text-brand-700" />
                    </div>
                    <p className="text-brand-600 font-medium text-sm tracking-tight">
                      Awaiting incoming data streams...
                    </p>
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
                          <h4 className="font-bold text-white tracking-tight text-lg group-hover:translate-x-1 transition-transform">
                            {lead.businessName}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">
                              {lead.city}
                            </span>
                            <div className="w-1 h-1 bg-brand-800 rounded-full" />
                            <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">
                              {lead.niche}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border transition-all',
                            lead.status === 'replied'
                              ? 'bg-brand-500/5 text-brand-300 border-brand-400/10'
                              : lead.status === 'outreach_sent'
                                ? 'bg-brand-500/5 text-brand-400 border-brand-400/10'
                                : 'bg-brand-500/5 text-brand-500 border-brand-400/10',
                          )}
                        >
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
