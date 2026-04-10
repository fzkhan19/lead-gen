import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Zap,
  Globe,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { cn } from './lib/utils';

// Components (to be created)
import Dashboard from './components/Dashboard';
import Prospector from './components/Prospector';
import LeadsTable from './components/LeadsTable';
import ChatInterface from './components/ChatInterface';
import ImageAnalyzer from './components/ImageAnalyzer';
import LeadAutomation from './components/LeadAutomation';
import WebsitesTracker from './components/WebsitesTracker';
import OutreachTracker from './components/OutreachTracker';
import Inbox from './components/Inbox';

type Tab = 'dashboard' | 'prospector' | 'leads' | 'websites' | 'outreach' | 'inbox' | 'analyze';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-brand-800 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass p-12 rounded-[40px] shadow-2xl text-center relative z-10 border border-white/[0.03]"
        >
          <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-white/10">
            <Zap className="w-8 h-8 text-brand-950 fill-brand-950" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">LeadGen<span className="text-brand-500">.ai</span></h1>
          <p className="text-brand-500 mb-12 leading-relaxed font-medium">Autonomous SDR & Closer Intelligence.<br />Engineering high-performance acquisition.</p>
          <button 
            onClick={handleLogin}
            className="btn-primary w-full flex items-center justify-center gap-4 py-4"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
          <p className="mt-8 text-[10px] font-mono text-brand-700 uppercase tracking-[0.2em]">Enterprise Grade Security Enabled</p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prospector', label: 'Prospector', icon: Search },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'websites', label: 'Websites', icon: Globe },
    { id: 'outreach', label: 'Outreach', icon: Send },
    { id: 'inbox', label: 'Negotiations', icon: MessageSquare },
    { id: 'analyze', label: 'Analyze', icon: ImageIcon },
  ];

  return (
    <div className="flex h-screen bg-brand-950 font-sans overflow-hidden">
      <LeadAutomation />
      
      {/* Sidebar - Minimal Modern */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 88 }}
        className="glass-dark border-r border-white/[0.02] flex flex-col relative z-50 transition-all duration-500 ease-[0.23, 1, 0.32, 1]"
      >
        <div className="p-6 mb-8 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-white/10">
                  <Zap className="w-6 h-6 text-brand-950 fill-brand-950" />
                </div>
                <span className="text-xl font-display font-bold text-white tracking-tight">LeadGen<span className="text-brand-500">.ai</span></span>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto shadow-2xl shadow-white/10"
              >
                <Zap className="w-6 h-6 text-brand-950 fill-brand-950" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative",
                activeTab === item.id 
                  ? "bg-white/[0.03] text-white shadow-sm" 
                  : "text-brand-500 hover:text-brand-300 hover:bg-white/[0.01]"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-300",
                activeTab === item.id ? "text-white scale-110" : "group-hover:scale-110"
              )} />
              {isSidebarOpen && (
                <span className="font-medium text-sm tracking-tight">{item.label}</span>
              )}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-5 bg-white rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.02] space-y-2">
          <button className="btn-ghost w-full flex items-center gap-4 px-4 py-3.5 text-brand-500 hover:text-brand-300 group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            {isSidebarOpen && <span className="font-medium text-sm tracking-tight">Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="btn-ghost w-full flex items-center gap-4 px-4 py-3.5 text-brand-500 hover:text-white hover:bg-white/5 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-medium text-sm tracking-tight">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <header className="h-20 flex items-center justify-between px-10 relative z-10 border-b border-white/[0.02]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="btn-icon p-2.5"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="h-4 w-px bg-white/[0.05]" />
            <h1 className="text-lg font-display font-bold text-white tracking-tight capitalize">
              {activeTab} <span className="text-brand-600 font-medium ml-2">/ Overview</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white tracking-tight leading-none">{user?.displayName}</span>
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mt-1">Enterprise Access</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Users className="w-5 h-5 text-brand-500" />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 relative z-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="h-full max-w-7xl mx-auto w-full"
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'prospector' && <Prospector />}
              {activeTab === 'leads' && <LeadsTable />}
              {activeTab === 'websites' && <WebsitesTracker />}
              {activeTab === 'outreach' && <OutreachTracker />}
              {activeTab === 'inbox' && <Inbox />}
              {activeTab === 'analyze' && <ImageAnalyzer />}
            </motion.div>
          </AnimatePresence>
          <LeadAutomation />
        </div>
      </main>
    </div>
  );
}
