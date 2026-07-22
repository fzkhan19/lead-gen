import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
  Activity,
  ArrowUpDown,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Filter,
  Gauge,
  Globe,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase.ts';
import WebsitePreview from './WebsitePreview.tsx';

export default function WebsitesTracker() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'setup_asc' | 'setup_desc' | 'monthly'>('newest');

  // Clipboard copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');

  useEffect(() => {
    const handleDemoChange = (e: any) => {
      if (e?.detail && typeof e.detail.enabled === 'boolean') {
        setDemoMode(e.detail.enabled);
      } else {
        setDemoMode(localStorage.getItem('demo_mode') === 'true');
      }
    };
    window.addEventListener('demoModeChanged', handleDemoChange);
    return () => window.removeEventListener('demoModeChanged', handleDemoChange);
  }, []);

  const DEMO_WEBSITES = [
    {
      id: 'demo-web-1',
      businessName: 'Boutique Pâtisserie Paris',
      city: 'Paris',
      niche: 'Bakery & Patisserie',
      status: 'replied',
      email: 'contact@patisserie-paris.fr',
      previewUrl: 'https://patisserie-paris-demo.ai',
      offerPrice: 349,
      subscriptionPrice: 19,
      designArchetype: 'luxury',
      outreachSentAt: { seconds: Math.floor(Date.now() / 1000) - 86400 },
      generatedHtml: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-black text-amber-100 font-serif flex flex-col justify-between min-h-screen p-8"><header class="border-b border-amber-900/30 pb-4"><h1 class="text-3xl font-bold text-amber-400">Boutique Pâtisserie Paris</h1><p class="text-xs text-amber-200/60 uppercase tracking-widest mt-1">Artisanal French Pastries & Fine Catering</p></header><main class="my-auto space-y-6 text-center"><p class="text-sm text-amber-100/80 leading-relaxed max-w-md mx-auto">Handcrafted macarons, viennoiseries, and custom wedding cakes delivered fresh daily across Île-de-France.</p><button class="bg-amber-500 text-black font-bold px-6 py-3 rounded-full text-xs hover:bg-amber-400 transition-colors">Reserve Private Tasting</button></main></body></html>`
    },
    {
      id: 'demo-web-2',
      businessName: 'L\'Atelier Boulangerie Lyon',
      city: 'Lyon',
      niche: 'Artisan Bakery',
      status: 'outreach_sent',
      email: 'boulangerie.lyon@gmail.com',
      previewUrl: 'https://boulangerie-lyon-demo.ai',
      offerPrice: 249,
      subscriptionPrice: 10,
      designArchetype: 'editorial',
      outreachSentAt: { seconds: Math.floor(Date.now() / 1000) - 43200 },
      generatedHtml: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-100 text-stone-900 font-sans p-8 min-h-screen flex flex-col justify-between"><header class="border-b border-stone-300 pb-4"><h1 class="text-2xl font-black">L'Atelier Boulangerie Lyon</h1></header><main class="my-auto space-y-4"><p class="text-stone-600 text-sm">Authentic sourdough breads baked fresh in traditional stone deck ovens every morning.</p></main></body></html>`
    },
    {
      id: 'demo-web-3',
      businessName: 'Apex Cybersecurity Labs',
      city: 'Berlin',
      niche: 'B2B Software & Security',
      status: 'closed',
      email: 'info@apexsecurity.de',
      previewUrl: 'https://apexsecurity-demo.ai',
      offerPrice: 499,
      subscriptionPrice: 49,
      designArchetype: 'tech-forward',
      outreachSentAt: { seconds: Math.floor(Date.now() / 1000) - 172800 },
      generatedHtml: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-950 text-blue-400 font-mono p-8 min-h-screen flex flex-col justify-between"><header class="border-b border-blue-900/40 pb-4"><h1 class="text-2xl font-bold text-white">Apex Cybersecurity Labs</h1></header></body></html>`
    },
  ];

  const effectiveLeads = demoMode
    ? [...leads, ...DEMO_WEBSITES.filter((dw) => !leads.some((l) => l.id === dw.id))]
    : leads;

  useEffect(() => {
    let unsubscribeSnap: () => void = () => {};
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, 'leads'),
        where('uid', '==', user.uid),
        where('status', 'in', ['outreach_sent', 'replied', 'closed']),
        orderBy('outreachSentAt', 'desc'),
      );
      unsubscribeSnap = onSnapshot(
        q,
        (snapshot) => {
          setLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'leads');
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeSnap();
      unsubscribeAuth();
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) {
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Extract all distinct archetypes actually generated for filters
  const availableArchetypes = Array.from(
    new Set(effectiveLeads.map((lead) => lead.designArchetype).filter(Boolean)),
  );

  // Compute stats
  const activeAssets = effectiveLeads.length;
  const mrr = effectiveLeads.reduce((sum, lead) => sum + (Number(lead.subscriptionPrice) || 10), 0);
  const totalSetupValue = effectiveLeads.reduce((sum, lead) => sum + (Number(lead.offerPrice) || 249), 0);
  const avgSetupValue = activeAssets > 0 ? Math.round(totalSetupValue / activeAssets) : 0;

  // Filter & Sort logic
  const filteredLeads = effectiveLeads
    .filter((lead) => {
      const nameMatch = (lead.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const cityMatch = (lead.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      const nicheMatch = (lead.niche || '').toLowerCase().includes(searchTerm.toLowerCase());
      const searchMatch = nameMatch || cityMatch || nicheMatch;

      const archetypeMatch =
        selectedArchetype === 'all' || lead.designArchetype === selectedArchetype;

      return searchMatch && archetypeMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.outreachSentAt?.seconds || 0;
        const dateB = b.outreachSentAt?.seconds || 0;
        return dateB - dateA;
      }
      if (sortBy === 'setup_asc') {
        return (a.offerPrice || 249) - (b.offerPrice || 249);
      }
      if (sortBy === 'setup_desc') {
        return (b.offerPrice || 249) - (a.offerPrice || 249);
      }
      if (sortBy === 'monthly') {
        return (b.subscriptionPrice || 10) - (a.subscriptionPrice || 10);
      }
      return 0;
    });

  // Get stable mock metrics based on lead ID
  const getMockMetrics = (id: string) => {
    // Basic hash of string to seed values
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const speed = 94 + (Math.abs(hash) % 6); // 94 - 99
    const uptime = 99.9; // standard
    const loadTime = (0.15 + Math.abs(hash % 15) / 100).toFixed(2); // 0.15s - 0.30s
    const visitors = 45 + (Math.abs(hash) % 250); // 45 - 295 visitors
    return { speed, uptime, loadTime, visitors };
  };

  // Helper to render beautiful archetype thumbnail vector mockups
  const renderArchetypeThumbnail = (archetype: string) => {
    switch (archetype?.toLowerCase()) {
      case 'tech-forward':
        return (
          <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-6 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div className="flex justify-between items-center z-10">
              <div className="w-12 h-1.5 bg-blue-500 rounded-full" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              </div>
            </div>
            <div className="space-y-2 z-10">
              <div className="w-3/4 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-sm" />
              <div className="w-1/2 h-1.5 bg-slate-800 rounded-sm" />
              <div className="w-5/6 h-1 bg-slate-800 rounded-sm" />
            </div>
            <div className="flex gap-2 z-10">
              <div className="w-12 h-4 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-center">
                <span className="text-[6px] font-mono text-blue-400">DEPLOYED</span>
              </div>
              <div className="w-8 h-4 bg-slate-900 border border-slate-800 rounded flex items-center justify-center">
                <span className="text-[6px] font-mono text-slate-500">API</span>
              </div>
            </div>
          </div>
        );
      case 'luxury':
        return (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col justify-between p-6 items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-950/80 to-neutral-950" />
            <div className="w-full flex justify-between items-center z-10 border-b border-amber-900/10 pb-2">
              <span className="text-[8px] font-serif font-semibold text-amber-500 tracking-[0.2em]">
                L
              </span>
              <div className="w-8 h-1 bg-neutral-800 rounded-full" />
            </div>
            <div className="text-center space-y-2 z-10 max-w-[80%]">
              <p className="text-[10px] font-serif italic text-amber-100 tracking-wide">
                Elite Digital Craft
              </p>
              <div className="w-12 h-[1px] bg-amber-500/30 mx-auto" />
            </div>
            <div className="w-16 h-4 border border-amber-500/20 rounded-full flex items-center justify-center z-10 bg-amber-950/20">
              <span className="text-[6px] font-serif text-amber-500 tracking-[0.1em]">PREVIEW</span>
            </div>
          </div>
        );
      case 'minimalist':
        return (
          <div className="absolute inset-0 bg-white flex flex-col justify-between p-6 overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="w-3 h-3 bg-black rounded-full" />
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="w-2/3 h-2 bg-neutral-900" />
              <div className="w-5/6 h-1 bg-neutral-300" />
            </div>
            <div className="w-10 h-3.5 bg-black flex items-center justify-center">
              <span className="text-[5px] font-sans text-white font-bold">INFO</span>
            </div>
          </div>
        );
      case 'brutalist':
        return (
          <div className="absolute inset-0 bg-neutral-100 flex flex-col justify-between p-5 overflow-hidden border-2 border-black">
            <div className="flex justify-between items-center bg-yellow-300 p-1 border-b-2 border-black">
              <span className="text-[6px] font-mono font-bold text-black">RAW</span>
              <div className="w-2 h-2 bg-black" />
            </div>
            <div className="space-y-1 bg-white p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-full h-1.5 bg-black" />
              <div className="w-3/4 h-1 bg-neutral-400" />
            </div>
            <div className="flex gap-2">
              <div className="px-1.5 py-0.5 bg-fuchsia-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[5px] font-mono font-bold text-black">GO</span>
              </div>
              <div className="px-1.5 py-0.5 bg-cyan-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[5px] font-mono font-bold text-black">INFO</span>
              </div>
            </div>
          </div>
        );
      case 'editorial':
        return (
          <div className="absolute inset-0 bg-stone-100 flex flex-col justify-between p-6 overflow-hidden">
            <div className="flex justify-between items-baseline border-b border-stone-300 pb-2">
              <span className="text-[9px] font-serif font-black text-stone-800">THE GAUL</span>
              <span className="text-[5px] font-sans text-stone-500">VOL. 02</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 bg-stone-800 rounded-sm overflow-hidden" />
              <div className="space-y-1">
                <div className="w-11/12 h-1 bg-stone-400 rounded-full" />
                <div className="w-5/6 h-1 bg-stone-400 rounded-full" />
              </div>
            </div>
            <div className="w-full flex justify-between items-center text-[5px] font-sans text-stone-500 pt-2 border-t border-stone-200">
              <span>EST. 2026</span>
              <span className="underline">READ STORY</span>
            </div>
          </div>
        );
      case 'organic':
        return (
          <div className="absolute inset-0 bg-emerald-950/90 flex flex-col justify-between p-6 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-emerald-800/30 rounded-full blur-xl" />
            <div className="flex justify-between items-center z-10">
              <span className="text-[8px] text-emerald-300 font-bold tracking-wider">🍃 ECO</span>
              <div className="w-8 h-1 bg-emerald-800/50 rounded-full" />
            </div>
            <div className="space-y-2 z-10">
              <div className="w-3/4 h-2.5 bg-emerald-100 rounded-md" />
              <div className="w-1/2 h-1 bg-emerald-800" />
            </div>
            <div className="w-12 h-4 bg-emerald-900 border border-emerald-800 rounded-full flex items-center justify-center z-10">
              <span className="text-[5px] text-emerald-300 font-medium">EXPLORE</span>
            </div>
          </div>
        );
      case 'playful':
        return (
          <div className="absolute inset-0 bg-teal-50 flex flex-col justify-between p-6 overflow-hidden">
            <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-pink-200/50 rounded-full" />
            <div className="absolute right-2 top-2 w-10 h-10 bg-yellow-200/50 rounded-full" />
            <div className="flex justify-between items-center z-10">
              <div className="w-4 h-4 bg-pink-400 rounded-full" />
              <div className="w-10 h-2 bg-teal-200 rounded-full" />
            </div>
            <div className="space-y-1 z-10">
              <div className="w-3/4 h-3 bg-yellow-400 rounded-full" />
              <div className="w-5/6 h-1 bg-teal-300 rounded-full" />
            </div>
            <div className="w-12 h-4 bg-pink-400 rounded-full flex items-center justify-center shadow-sm z-10">
              <span className="text-[5px] text-white font-black">HELLO</span>
            </div>
          </div>
        );
      case 'bold':
        return (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col justify-between p-6 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-orange-500 tracking-tighter">IMPACT</span>
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="w-11/12 h-3.5 bg-white" />
              <div className="w-3/4 h-1.5 bg-neutral-700" />
            </div>
            <div className="w-full h-4 bg-orange-500 flex items-center justify-center">
              <span className="text-[6px] font-black text-black tracking-widest">LAUNCH TODAY</span>
            </div>
          </div>
        );
      case 'retro':
        return (
          <div className="absolute inset-0 bg-amber-50 flex flex-col justify-between p-6 overflow-hidden">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(120,50,10,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(120,50,10,0.3) 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            />
            <div className="flex justify-between items-center z-10">
              <span className="text-[8px] font-mono font-bold text-amber-900">📼 RETRO</span>
              <div className="w-8 h-1 bg-amber-200 rounded-full" />
            </div>
            <div className="space-y-1.5 z-10">
              <div className="w-2/3 h-2.5 bg-amber-900" />
              <div className="w-full h-1 bg-orange-400" />
            </div>
            <div className="w-12 h-4 bg-orange-500 flex items-center justify-center z-10">
              <span className="text-[5px] font-mono text-white font-bold">PLAY</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 bg-slate-900 flex flex-col justify-between p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-slate-900 to-brand-900" />
            <div className="flex justify-between items-center z-10">
              <div className="w-8 h-2 bg-brand-500 rounded-sm" />
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>
            <div className="space-y-2 z-10">
              <div className="w-5/6 h-2.5 bg-slate-700 rounded-sm" />
              <div className="w-3/4 h-1.5 bg-slate-800 rounded-sm" />
            </div>
            <div className="w-full flex justify-between items-center z-10">
              <div className="w-10 h-3 bg-brand-600/20 border border-brand-500/20 rounded-sm" />
              <div className="w-6 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Sparkles className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-brand-500 text-sm font-mono tracking-widest uppercase">
          Syncing Ecosystem...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            Ecosystem Dashboard
          </h2>
          <p className="text-brand-500 font-medium mt-1">
            Real-time telemetry and management of live AI-deployed digital assets.
          </p>
        </div>
      </div>

      {/* Bento Stats Row */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="glass p-6 rounded-3xl border border-white/[0.02] bg-white/[0.01] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block">
                Active Deployed Assets
              </span>
              <p className="text-3xl font-display font-bold text-white">{activeAssets}</p>
              <span className="text-[10px] text-brand-400 font-mono flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3 text-brand-400" />
                Telemetry Active
              </span>
            </div>
            <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400">
              <Globe className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="glass p-6 rounded-3xl border border-white/[0.02] bg-white/[0.01] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block">
                Projected MRR
              </span>
              <p className="text-3xl font-display font-bold text-white">€{mrr}</p>
              <span className="text-[10px] text-brand-400 font-mono flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-brand-400" />
                Fixed hosting & updates
              </span>
            </div>
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="glass p-6 rounded-3xl border border-white/[0.02] bg-white/[0.01] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block">
                Avg Setup Value
              </span>
              <p className="text-3xl font-display font-bold text-white">€{avgSetupValue}</p>
              <span className="text-[10px] text-brand-400 font-mono flex items-center gap-1 mt-1">
                <Gauge className="w-3 h-3 text-brand-400" />
                Value optimized
              </span>
            </div>
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive Toolbar */}
      {leads.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
            <input
              type="text"
              placeholder="Search assets by business, niche, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-950/60 border border-white/[0.05] rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-brand-700 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Filtering & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Archetype Filter Pillbox */}
            <div className="flex items-center gap-2 bg-brand-950/60 border border-white/[0.05] rounded-2xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-600" />
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                className="bg-transparent text-xs text-brand-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-brand-950 text-white">
                  All Archetypes
                </option>
                {availableArchetypes.map((arch) => (
                  <option key={arch} value={arch} className="bg-brand-950 text-white capitalize">
                    {arch}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-brand-950/60 border border-white/[0.05] rounded-2xl px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-brand-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest" className="bg-brand-950 text-white">
                  Sort: Newest Deployed
                </option>
                <option value="setup_asc" className="bg-brand-950 text-white">
                  Sort: Setup Price (Low-High)
                </option>
                <option value="setup_desc" className="bg-brand-950 text-white">
                  Sort: Setup Price (High-Low)
                </option>
                <option value="monthly" className="bg-brand-950 text-white">
                  Sort: Highest Subscription
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {leads.length === 0 ? (
        <div className="glass p-24 text-center rounded-[40px] border border-white/[0.03]">
          <div className="w-20 h-20 bg-brand-900/50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/[0.03] animate-pulse-subtle">
            <Globe className="w-8 h-8 text-brand-700" />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-3">No Assets Deployed</h3>
          <p className="text-brand-600 max-w-xs mx-auto text-sm leading-relaxed">
            Launch an AI campaign from the leads table to generate, deploy, and track websites here.
          </p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass p-20 text-center rounded-[40px] border border-white/[0.03]">
          <Search className="w-8 h-8 text-brand-700 mx-auto mb-4" />
          <p className="text-brand-500 font-medium">No assets matching your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedArchetype('all');
            }}
            className="text-xs text-brand-400 underline mt-2 hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredLeads.map((lead, i) => {
            const metrics = getMockMetrics(lead.id);
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card group overflow-hidden rounded-[40px] flex flex-col h-full border border-white/[0.03] hover:border-white/[0.08] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500"
              >
                {/* Visual Thumbnail Frame */}
                <div className="relative h-48 bg-brand-950 overflow-hidden border-b border-white/[0.03]">
                  {renderArchetypeThumbnail(lead.designArchetype)}

                  {/* Subtle Gradient Cover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-transparent to-transparent opacity-60" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/60 border border-white/5 text-brand-400">
                      {lead.designArchetype || 'Modern'}
                    </span>
                  </div>

                  {/* Telemetry Indicator (Uptime Blink) */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 border border-white/5 px-2 py-1 rounded">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-lg font-display font-bold text-white tracking-tight truncate group-hover:text-brand-300 transition-colors">
                          {lead.businessName}
                        </h3>
                        <p className="text-[10px] font-mono text-brand-300 uppercase tracking-widest truncate">
                          {lead.niche}
                        </p>
                      </div>

                      {lead.previewUrl && (
                        <button
                          onClick={() => copyToClipboard(lead.previewUrl, lead.id)}
                          className="p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl text-brand-300 hover:text-white transition-all relative"
                          title="Copy preview link"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-up" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-brand-300">
                      <MapPin className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-wider truncate">
                        {lead.city}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {lead.previewUrl ? (
                        <a
                          href={lead.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors truncate underline decoration-cyan-400/30 hover:decoration-cyan-300 tracking-wide block w-full"
                          title={lead.previewUrl}
                        >
                          {lead.previewUrl.replace('https://', '').replace('http://', '')}
                        </a>
                      ) : (
                        <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider">
                          No live URL generated
                        </span>
                      )}
                    </div>

                    {/* Technical Mock Telemetry Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.01] border border-white/[0.02] rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-brand-400 uppercase">
                          Performance
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400">
                          {metrics.speed}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-l border-white/[0.02] pl-3">
                        <span className="text-[9px] font-mono text-brand-400 uppercase">
                          Response
                        </span>
                        <span className="text-[9px] font-mono font-bold text-brand-200">
                          {metrics.loadTime}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Action Bar */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">
                          One-time Setup
                        </span>
                        <span className="text-base font-display font-bold text-white">
                          €{lead.offerPrice || '249'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">
                          Hosting / mo
                        </span>
                        <span className="text-base font-display font-bold text-white">
                          €{lead.subscriptionPrice || '10'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="flex-1 btn-sm bg-white/5 hover:bg-white/10 text-white font-medium border border-white/5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        Preview Mockup
                      </button>
                      {lead.previewUrl && (
                        <a
                          href={lead.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.05] rounded-xl text-brand-300 hover:text-white transition-all flex items-center justify-center shrink-0"
                          title="Visit live site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Website Preview Full Screen Modal */}
      <AnimatePresence>
        {selectedLead && (
          <WebsitePreview
            html={
              selectedLead.generatedHtml ||
              "<html><body style='background:#09090b;color:#a1a1aa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;'><h1>No preview available</h1></body></html>"
            }
            businessName={selectedLead.businessName || 'Business'}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
