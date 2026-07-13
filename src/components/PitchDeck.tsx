import { useState } from 'react';
import { 
  Presentation, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Target, 
  Rocket, 
  DollarSign, 
  Layers, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Lightbulb, 
  Download,
  Terminal,
  Activity,
  Users,
  Search,
  MessageSquare,
  Briefcase,
  Megaphone,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Slide {
  title: string;
  subtitle: string;
  icon: any;
  content: React.ReactNode;
}

export default function PitchDeck() {
  const [activeSubTab, setActiveSubTab] = useState<'deck' | 'report'>('deck');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define highly detailed, multi-customer, multi-playbook slides
  const slides: Slide[] = [
    {
      title: "LeadGen.ai Executive Overview",
      subtitle: "Autonomous B2B Lead Sourcing & Instant Visual Pitching",
      icon: Zap,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-ping" />
              <span className="text-[10px] font-mono text-brand-300 uppercase tracking-widest font-bold">REVOLUTIONIZING SALES CONVERSIONS</span>
            </div>
            <h3 className="text-4xl font-display font-bold text-white tracking-tight leading-tight">
              The Only Self-Correcting B2B Engine That Converts Cold Prospects Into Inbound Clients via Instant Proof-of-Value
            </h3>
            <p className="text-brand-500 text-sm leading-relaxed">
              LeadGen.ai is not just a scraper or an email dispatcher. It is an end-to-end autonomous business development package that combines <strong>stealth web crawling</strong>, <strong>generative layout design (HTML/Tailwind)</strong>, and <strong>secure enterprise SMTP outreach</strong> to showcase fully functional bespoke mockups to local merchants before they even reply to your pitch.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-white font-bold text-sm">Autonomous Loop</p>
                <p className="text-xs text-brand-600 mt-1">Completes prospecting, design, hosting, and outreach in under 60 seconds.</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <p className="text-white font-bold text-sm">Value-First Model</p>
                <p className="text-xs text-brand-600 mt-1">Provides immediate tangible proof-of-work, multiplying response rates by up to 10x.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative aspect-square bg-gradient-to-b from-brand-950 to-black rounded-[40px] border border-white/5 overflow-hidden flex flex-col justify-between p-8 shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="flex justify-between items-center z-10">
              <span className="text-[10px] font-mono text-brand-400 font-bold tracking-widest">SYSTEM TELEMETRY</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
            </div>
            <div className="space-y-6 z-10 my-auto">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-brand-600 uppercase tracking-wider block">Active Pipeline Nodes</span>
                <p className="text-5xl font-display font-black text-white tracking-tighter">9/9 Live</p>
              </div>
              <div className="h-px bg-white/[0.05]" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-mono text-brand-600 uppercase block">Outreach Speed</span>
                  <span className="text-xs font-mono font-bold text-white">60s / Lead</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-brand-600 uppercase block">Design Success</span>
                  <span className="text-xs font-mono font-bold text-brand-400">100% Valid CSS</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center z-10 text-[9px] font-mono text-brand-700 uppercase tracking-widest">
              <span>Secure SMTP: ACTIVE</span>
              <span>DB Sync: ONLINE</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Three Massive Business Playbooks",
      subtitle: "Unlocking Diverse High-Yield Business Models",
      icon: Rocket,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-stretch">
          {[
            {
              title: "1. Autonomous Local Agency",
              target: "Targeting: Local Brick-and-Mortars",
              desc: "Deploy LeadGen.ai to target offline merchants with outdated or non-existent sites (e.g., Bakeries, Plumbers, Roofers). The AI builds customized responsive mockups, and drafts personal emails, pitching them high-converting websites on a recurring lease model.",
              revenue: "€249 Setup + €19-€49/mo Retainer",
              highlight: "98% Gross Margin on Hosting"
            },
            {
              title: "2. Programmatic B2B SaaS",
              target: "Targeting: Sales Teams & SDRs",
              desc: "Provide cold outbound specialists with a portal where they can input their own spreadsheets. The platform automatically generates custom-tailored personalized landing pages for every individual corporate client, embedding custom interactive dashboards to secure high-intent sales calls.",
              revenue: "€99 - €299 Monthly SaaS Subscriptions",
              highlight: "Highly Scalable Software Play"
            },
            {
              title: "3. Hyper-Local Directories",
              target: "Targeting: Local Merchant Portals",
              desc: "Launch niche curated directories (e.g., 'Parisian Spas'). Reach out to unlisted or weakly ranked local service providers, offering them high-ranking pre-filled slots and a premium autonomous single-page website to boost their Google Business profile authority.",
              revenue: "€29 - €79/mo listing subscription",
              highlight: "Ideal for Rapid SEO Domination"
            }
          ].map((item, i) => (
            <div key={i} className="glass bg-white/[0.01] border border-white/[0.03] p-6 rounded-[32px] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded">
                    PLAYBOOK 0{i + 1}
                  </span>
                  <span className="text-[9px] font-mono text-brand-600 font-bold uppercase">{item.highlight}</span>
                </div>
                <h4 className="text-xl font-display font-bold text-white tracking-tight">{item.title}</h4>
                <p className="text-[10px] font-mono text-brand-500 uppercase tracking-widest">{item.target}</p>
                <p className="text-xs text-brand-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-white/[0.02] flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-700 uppercase">Pricing Retainer</span>
                <span className="text-xs font-mono font-bold text-white bg-white/5 border border-white/5 px-3 py-1 rounded">{item.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Playbook 1: Local Agency Blueprint",
      subtitle: "The Ultimate Passive Cashflow Loop for Offline Businesses",
      icon: Briefcase,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
              A Zero-Friction Acquisition Engine Targeting Brick-and-Mortar Merchants
            </h3>
            <p className="text-brand-500 text-sm leading-relaxed">
              Local service businesses (Plumbers, Landscapers, Dentists) often pay thousands for website development or survive with completely unoptimized pages. This playbook shows how to automate the entire agency pipeline using LeadGen.ai to secure high-margin recurring retainers.
            </p>
            <div className="space-y-4">
              {[
                { label: "Step 1: Automated Sourcing", desc: "Select a city and category (e.g. 'Bakeries in Munich'). The system scrapes matching targets without a valid website or with slow performance metrics." },
                { label: "Step 2: Hyper-Personalized Pitch", desc: "Our engine designs a bespoke web preview including localized maps, service menus, and phone buttons based on their actual location data." },
                { label: "Step 3: Low-Friction Offer", desc: "Sell them a full digital makeover for just €249 upfront and €19/mo. It's an instant 'Yes' because they can see and click the end-product beforehand." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">{idx+1}</span>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{step.label}</p>
                    <p className="text-[11px] text-brand-600 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 bg-white/[0.01] border border-white/[0.03] p-8 rounded-[40px] space-y-6">
            <h4 className="text-xs font-mono text-brand-500 uppercase tracking-widest">Financial Projection Model</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-white">Monthly Active Clients</p>
                  <p className="text-[10px] text-brand-600">Generated automatically by AI</p>
                </div>
                <div className="text-lg font-display font-bold text-white">50</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-white">Total Setup Value</p>
                  <p className="text-[10px] text-brand-600">€249.00 setup fee</p>
                </div>
                <div className="text-lg font-display font-bold text-emerald-400">€12,450.00</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-white">Projected MRR</p>
                  <p className="text-[10px] text-brand-600">€19.00/mo hosting cost</p>
                </div>
                <div className="text-lg font-display font-bold text-brand-400">€950.00 / mo</div>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
              <span className="text-xs text-emerald-400 font-bold">Estimated Workload: 1-2 Hours/Week</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Playbook 2: Scale B2B Outbound SaaS",
      subtitle: "Personalization at Scale for Enterprise & Sales Orgs",
      icon: Network,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
              Unlocking Ultra-Personalized Outbound Pipelines for Enterprise Sales Teams
            </h3>
            <p className="text-brand-500 text-sm leading-relaxed">
              In modern enterprise B2B sales, generic copy is dead. Top-performing SDR teams use personalization to break through noise. By packaging LeadGen.ai as an outbound SaaS, sales reps can upload high-value accounts and instantly generate bespoke micro-websites styled with their prospect's corporate brand colors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-brand-400">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Dynamic Colorways</span>
                </div>
                <p className="text-[11px] text-brand-600 leading-relaxed">
                  The AI identifies the prospect's brand color schema from their existing web headers and compiles a matching premium layout archetype to show maximum alignment.
                </p>
              </div>
              <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-brand-400">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Interactive Skeletons</span>
                </div>
                <p className="text-[11px] text-brand-600 leading-relaxed">
                  Instead of static screenshots, the email link leads to a live HTML demo where they can click tabs, view service portfolios, and fill forms.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 p-6 bg-brand-950/40 border border-white/[0.05] rounded-[40px] space-y-6">
            <h4 className="text-xs font-mono text-brand-500 uppercase tracking-widest">SaaS Use Cases & Value Metric</h4>
            <div className="space-y-4">
              {[
                { metric: "8.5x", label: "Email Open-to-Reply Lift", desc: "Visual interactive demos out-perform text pitches by several hundred percent." },
                { metric: "15 Min", label: "Time Saved per Rep/Day", desc: "Reps no longer research lead metrics or manually design visual assets." },
                { metric: "€149/mo", label: "Average Seat Value", desc: "Target SaaS price for mid-size outbound sales teams." }
              ].map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-white/[0.02] border border-white/[0.03] rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">{stat.label}</p>
                    <p className="text-[10px] text-brand-600 mt-0.5">{stat.desc}</p>
                  </div>
                  <div className="text-lg font-display font-black text-brand-400">{stat.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Playbook 3: Hyper-Local SEO Directories",
      subtitle: "Automated Directory Construction and Listing Monetization",
      icon: Globe,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
              Create SEO Powerhouses for Niche Verticals with Auto-Prebuilt Premium Slots
            </h3>
            <p className="text-brand-500 text-sm leading-relaxed">
              When searching for localized services (e.g., "Plumbers in Boston"), users trust aggregated business directory platforms. You can use LeadGen.ai to construct high-ranking directory sites and approach unverified merchants with a pre-created visual profile, offering them premium listing ownership.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex gap-4">
                <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center shrink-0 text-brand-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Unverified Sourcing Sweep</p>
                  <p className="text-[11px] text-brand-600 mt-0.5">Scrapes local business maps and creates beautiful default listings with AI generated descriptions, layouts, and performance optimization.</p>
                </div>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex gap-4">
                <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center shrink-0 text-brand-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Claim-My-Listing Funnels</p>
                  <p className="text-[11px] text-brand-600 mt-0.5">Sends automated notifications to owners saying, 'Your premium Boston directory profile is ready and ranking. Claim ownership and get your custom single-page website today.'</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-gradient-to-tr from-brand-950 to-black p-8 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-xs font-mono text-brand-400 uppercase tracking-widest">Aesthetic Design Archetype Preview</h4>
            <p className="text-xs text-brand-600 leading-relaxed">
              Our websites module dynamically supports 9 distinct, highly-polished layout languages matching target merchant brand identities:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-brand-400">
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Tech-Forward</div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Luxury Luxe</div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Stark Minimalist</div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Heavy Brutalist</div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Classic Editorial</div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">✦ Earthy Organic</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Ecosystem Architecture & Playbooks</h2>
          <p className="text-brand-500 font-medium mt-1">Pitch materials, technical manuals, and monetization models targeting multiple customer groups.</p>
        </div>
        
        <div className="flex bg-brand-950/60 border border-white/[0.05] p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('deck')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === 'deck' ? "bg-white text-brand-950 shadow-lg" : "text-brand-500 hover:text-white"
            )}
          >
            <Presentation className="w-4 h-4" />
            Interactive Presentation
          </button>
          <button
            onClick={() => setActiveSubTab('report')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === 'report' ? "bg-white text-brand-950 shadow-lg" : "text-brand-500 hover:text-white"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Technical Playbook Manual
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'deck' ? (
          <motion.div
            key="slide-deck-viewer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="glass rounded-[40px] border border-white/[0.03] shadow-2xl overflow-hidden bg-white/[0.01] flex flex-col justify-between min-h-[600px] p-8 md:p-12"
          >
            {/* Header of Slide */}
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  {(() => {
                    const Icon = slides[currentSlide].icon;
                    return <Icon className="w-5 h-5 text-brand-400" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">
                    {slides[currentSlide].title}
                  </h3>
                  <p className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mt-0.5">
                    {slides[currentSlide].subtitle}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-brand-700 font-bold">
                SLIDE {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Slide Body */}
            <div className="flex-1 my-8 md:my-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="h-full"
                >
                  {slides[currentSlide].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Navigation footer */}
            <div className="flex justify-between items-center border-t border-white/[0.03] pt-6">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="btn-icon p-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-white disabled:opacity-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      currentSlide === i ? "bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "bg-white/10"
                    )}
                  />
                ))}
              </div>

              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={() => setActiveSubTab('report')}
                  className="btn-primary py-3 px-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                >
                  <span>Read Full Manual</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-icon p-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="technical-report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Sidebar navigation for sections */}
            <div className="lg:col-span-3 space-y-3 sticky top-4">
              <div className="glass p-6 rounded-3xl border border-white/[0.03] space-y-4">
                <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Technical Guide</h4>
                <div className="space-y-1">
                  <a href="#overview" className="block text-xs font-bold text-brand-500 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">1. Platform Overview</a>
                  <a href="#customers" className="block text-xs font-bold text-brand-500 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">2. Core Customer Profiles</a>
                  <a href="#scraping" className="block text-xs font-bold text-brand-500 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">3. Intelligence Scraper</a>
                  <a href="#generator" className="block text-xs font-bold text-brand-500 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">4. Design & Style Engines</a>
                  <a href="#playbook" className="block text-xs font-bold text-brand-500 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">5. Startup Sourcing Ideas</a>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="lg:col-span-9 glass p-10 md:p-12 rounded-[40px] border border-white/[0.03] shadow-2xl bg-white/[0.01] space-y-16">
              {/* Section 1 */}
              <section id="overview" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">1. Platform Overview & System Mechanics</h3>
                </div>
                <p className="text-brand-500 text-sm leading-relaxed">
                  <strong>LeadGen.ai</strong> is an enterprise-grade Sales Development Representative (SDR) and design engine package that works completely autonomously. Built on a robust Express backend and a high-performance React front-end, it integrates Playwright web crawlers, Firebase persistent data architecture, and Gemini generative models to scout and acquire local merchants.
                </p>
                <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl font-mono text-xs text-brand-300 space-y-2">
                  <div className="flex justify-between border-b border-white/[0.02] pb-2">
                    <span className="text-brand-600 font-bold">CORE MODULE</span>
                    <span className="text-brand-600 font-bold">AUTOMATION ARCHITECTURE</span>
                  </div>
                  <p><strong className="text-white">Autonomous Agent:</strong> Initiates strategic target choices, choosing optimal target locations and niches based on market voids.</p>
                  <p><strong className="text-white">Data Prospecting:</strong> Headless chromium engine extracts clean Google Maps and Yelp-like business telemetry.</p>
                  <p><strong className="text-white">Layout Engine:</strong> Dynamically compiles custom styled preview websites matching aesthetic archetypes.</p>
                  <p><strong className="text-white">SDR Outbox:</strong> Triggers SMTP handshakes to dispatch bespoke high-value mockups.</p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="customers" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">2. Core Customer Profiles & Use Cases</h3>
                </div>
                <p className="text-brand-500 text-sm leading-relaxed">
                  LeadGen.ai is intentionally engineered to capture multiple completely distinct B2B markets, each resolving discrete workflows using our core code-generation features:
                </p>
                <div className="space-y-4">
                  <div className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-2">
                    <h4 className="text-base font-bold text-white uppercase tracking-wider">Group A: Local Marketing Agencies & Freelance Web Developers</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      <strong>Core Pain Point:</strong> Sourcing and cold emailing takes endless hours; pitches are easily ignored.
                      <br />
                      <strong>Use Case:</strong> Launch continuous automated local scans, auto-generating bespoke tailored preview mockups, and routing these through secure Lark SMTP. The agency collects massive setup fees and recurring retains by proving their design capabilities instantly.
                    </p>
                  </div>
                  <div className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-2">
                    <h4 className="text-base font-bold text-white uppercase tracking-wider">Group B: High-Volume Outbound B2B SaaS Companies</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      <strong>Core Pain Point:</strong> High lead volumes but very low click-through rates.
                      <br />
                      <strong>Use Case:</strong> SaaS platforms embed LeadGen.ai as a white-labeled outbound acceleration tool. Enterprise sales reps can upload high-value target accounts to automatically generate a hyper-personalized corporate page featuring matching colorways and localized content, increasing client replies up to 800%.
                    </p>
                  </div>
                  <div className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-2">
                    <h4 className="text-base font-bold text-white uppercase tracking-wider">Group C: Hyper-Local SEO Directory Aggregators</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      <strong>Core Pain Point:</strong> Creating vertical directories manually is incredibly slow; merchants don't want to buy unverified slots.
                      <br />
                      <strong>Use Case:</strong> Run mass category scrapes in target regions. Generate professional listing slots on-the-fly and pitch the merchants using unverified slots. Merchants claim ownership and subscribe to a premium monthly membership, generating steady cashflow.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="scraping" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">3. Playwright Headless Sourcing Crawler</h3>
                </div>
                <p className="text-brand-500 text-sm leading-relaxed">
                  The data prospector uses a headless chromium browser orchestrated via Playwright Native to execute clean scraping of local businesses, their existing landing page quality, and critical OSINT metrics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Stealth Header Sourcing</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      Randomized user agents, scroll-delay parameters, and viewport dimensions prevent anti-bot challenges and ensure deep scanning.
                    </p>
                  </div>
                  <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Visual Proof Mockups</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      Playwright takes live high-quality viewport snapshots of the target’s existing website, instantly assessing layout issues to formulate the perfect AI pitch.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="generator" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">4. Bespoke Digital Asset & Code Generation</h3>
                </div>
                <p className="text-brand-500 text-sm leading-relaxed">
                  Our custom generative design engine receives structured market context and converts it into responsive, production-ready static HTML assets styled with Tailwind CSS.
                </p>
                <div className="p-6 bg-brand-950/40 border border-white/[0.04] rounded-3xl font-mono text-xs text-brand-400 space-y-3">
                  <div className="flex items-center gap-2 text-brand-500 border-b border-white/[0.03] pb-3">
                    <Terminal className="w-4 h-4 text-brand-400" />
                    <span>SYSTEM ARCHETYPE MATRIX</span>
                  </div>
                  <p><strong className="text-white">Tech-Forward:</strong> Dark background, neon cyber details, grid textures, custom telemetry displays.</p>
                  <p><strong className="text-white">Luxury:</strong> Deep black & gold combinations, premium typography tracks, generous letter-spacing.</p>
                  <p><strong className="text-white">Minimalist:</strong> Stark white backdrops, ultra-thick geometric cards, high negative space ratios.</p>
                  <p><strong className="text-white">Brutalist:</strong> Heavy borders, yellow/black retro-caution pairings, offset isometric card shadows.</p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="playbook" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">5. Elite Startup Sourcing Playbook</h3>
                </div>
                <p className="text-brand-500 text-sm leading-relaxed">
                  How to utilize this software to capture local, underserved, high-conversion markets.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">The Local Sweep Method</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      Choose medium-tier locations (e.g., population 50,000 to 250,000) and target service industries with older websites or high ticket values (plumbers, roofers, luxury bakeries). Run continuous automated sweeps, sending direct demo links. Converts at 8-15%.
                    </p>
                  </div>

                  <div className="p-8 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">The Host Arbitrage Strategy</h4>
                    <p className="text-xs text-brand-600 leading-relaxed">
                      Offer setup for a negligible fee or completely free, but charge a non-negotiable monthly SaaS maintenance retainer of €19-€49. The hosting of static assets costs fractions of a cent, yielding near-pure recurring profit margins.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
