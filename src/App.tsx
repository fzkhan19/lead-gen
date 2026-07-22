import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Activity,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Presentation,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
// Components (to be created)
import Dashboard from './components/Dashboard.tsx';
import ImageAnalyzer from './components/ImageAnalyzer.tsx';
import Inbox from './components/Inbox.tsx';
import LeadAutomation from './components/LeadAutomation.tsx';
import LeadsTable from './components/LeadsTable.tsx';
import OutreachTracker from './components/OutreachTracker.tsx';
import PitchDeck from './components/PitchDeck.tsx';
import Prospector from './components/Prospector.tsx';
import SettingsComponent from './components/Settings.tsx';
import WebsitesTracker from './components/WebsitesTracker.tsx';
import CampaignLogs from './components/CampaignLogs.tsx';
import { auth } from './firebase.ts';
import { cn } from './lib/utils.ts';

type Tab =
  | 'dashboard'
  | 'prospector'
  | 'leads'
  | 'websites'
  | 'outreach'
  | 'inbox'
  | 'analyze'
  | 'deck'
  | 'logs'
  | 'settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === 'true');
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);

  useEffect(() => {
    (window as any).__activeCampaigns = (window as any).__activeCampaigns || new Set();

    const checkCampaigns = () => {
      const active =
        Boolean((window as any).__activeCampaigns) && (window as any).__activeCampaigns.size > 0;
      setIsCampaignRunning(active);
    };

    (window as any).setCampaignActive = (key: string, active: boolean) => {
      if (!(window as any).__activeCampaigns) {
        (window as any).__activeCampaigns = new Set();
      }
      if (active) {
        (window as any).__activeCampaigns.add(key);
      } else {
        (window as any).__activeCampaigns.delete(key);
      }
      window.dispatchEvent(new CustomEvent('campaignStatusChanged'));
    };

    window.addEventListener('campaignStatusChanged', checkCampaigns);
    checkCampaigns();

    return () => {
      window.removeEventListener('campaignStatusChanged', checkCampaigns);
    };
  }, []);

  const toggleDemoMode = () => {
    if (isCampaignRunning) {
      return;
    }
    const nextMode = !demoMode;
    setDemoMode(nextMode);
    localStorage.setItem('demo_mode', nextMode ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('demoModeChanged', { detail: { enabled: nextMode } }));
  };

  useEffect(() => {
    // 1. Restore shared password session from localStorage if present
    const savedSession = localStorage.getItem('leadgen_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch {
        localStorage.removeItem('leadgen_session');
      }
    }

    // 2. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Enforce the administrator restriction on Google accounts
        const allowedEmail = 'faizpathan1717@gmail.com';
        if (firebaseUser.email?.toLowerCase() === allowedEmail.toLowerCase()) {
          const matchedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Faiz Pathan',
            photoURL: firebaseUser.photoURL,
            isGoogle: true,
          };
          localStorage.setItem('leadgen_session', JSON.stringify(matchedUser));
          setUser(matchedUser);
          setAuthError(null);
        } else {
          // Instantly kick out unauthorized users and show a friendly yet clear notification
          await signOut(auth);
          localStorage.removeItem('leadgen_session');
          setUser(null);
          setAuthError(
            `Access Denied: Only ${allowedEmail} is authorized to access via Google. If you are a guest, please use the Shared Credentials login tab.`,
          );
        }
      } else {
        // If Google sign-out is triggered, and there is no active password-based session, clear the user
        const currentSession = localStorage.getItem('leadgen_session');
        if (currentSession) {
          const parsed = JSON.parse(currentSession);
          if (parsed.isGoogle) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(`Sign-in encountered an error: ${error.message}`);
      }
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Default values if environment variables are not set
    const correctUsername = 'admin';
    const correctPassword = (import.meta as any).env?.VITE_SHARED_PASSWORD || 'leadgen2026';

    if (username.trim() === correctUsername && password === correctPassword) {
      const customSession = {
        uid: 'shared-session-user',
        email: 'shared-partner@prospekt.ai',
        displayName: 'Shared Partner Account',
        photoURL: null,
        isGoogle: false,
      };
      localStorage.setItem('leadgen_session', JSON.stringify(customSession));
      setUser(customSession);
      setUsername('');
      setPassword('');
    } else {
      setAuthError('Incorrect username or password. Please try again.');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('leadgen_session');
    await signOut(auth);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
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
          className="max-w-md w-full glass p-8 sm:p-10 rounded-2xl shadow-2xl text-center relative z-10 border border-white/[0.03]"
        >
          <div className="w-16 h-16 mx-auto mb-8 relative">
            <img src="/favicon.svg" alt="Prospekt.ai Logo" className="w-full h-full rounded-2xl shadow-2xl shadow-brand-500/10 hover:scale-105 transition-transform duration-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 tracking-tight">
            Prospekt<span className="text-brand-500">.ai</span>
          </h1>
          <p className="text-brand-500 mb-8 leading-relaxed text-xs sm:text-sm font-medium">
            Autonomous SDR & Closer Intelligence.
            <br />
            Engineering high-performance acquisition.
          </p>

          {/* Tab Selector */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/[0.03]">
            <button
              onClick={() => {
                setAuthMethod('google');
                setAuthError(null);
              }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2',
                authMethod === 'google'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-300',
              )}
            >
              <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
              Google Admin
            </button>
            <button
              onClick={() => {
                setAuthMethod('password');
                setAuthError(null);
              }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2',
                authMethod === 'password'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-300',
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Shared Access
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/5 border border-red-500/15 rounded-xl flex gap-3 text-left overflow-hidden"
              >
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed font-medium">{authError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {authMethod === 'google' ? (
              <motion.div
                key="google-pane"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-xs text-brand-500 text-left mb-4 leading-relaxed">
                  Sign in with your registered Google account. Access is restricted exclusively to
                  authorized emails.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  className="btn-primary w-full flex items-center justify-center gap-4 py-3.5 rounded-xl font-semibold"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="password-pane"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required={true}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-brand-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-brand-800 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 rounded-xl font-semibold mt-6"
                >
                  Sign In with Password
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-[10px] font-mono text-brand-700 uppercase tracking-[0.2em]">
            Enterprise Grade Security Enabled
          </p>
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
    { id: 'deck', label: 'Deck & Report', icon: Presentation },
    { id: 'logs', label: 'Campaign Logs', icon: Activity },
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
                <img src="/favicon.svg" alt="Prospekt.ai Logo" className="w-10 h-10 rounded-xl" />
                <span className="text-xl font-display font-bold text-white tracking-tight">
                  Prospekt<span className="text-brand-500">.ai</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <img src="/favicon.svg" alt="Prospekt.ai Logo" className="w-10 h-10 rounded-xl" />
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
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative',
                activeTab === item.id
                  ? 'bg-white/[0.03] text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-300 hover:bg-white/[0.01]',
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-all duration-300',
                  activeTab === item.id ? 'text-white scale-110' : 'group-hover:scale-110',
                )}
              />
              {isSidebarOpen && (
                <span className="font-medium text-sm tracking-tight">{item.label}</span>
              )}
              {activeTab === item.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-5 bg-white rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.02] space-y-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative',
              activeTab === 'settings'
                ? 'bg-white/[0.03] text-white shadow-sm'
                : 'text-brand-500 hover:text-brand-300 hover:bg-white/[0.01]',
            )}
          >
            <Settings
              className={cn(
                'w-5 h-5 transition-all duration-300 group-hover:rotate-45',
                activeTab === 'settings' ? 'text-white scale-110' : '',
              )}
            />
            {isSidebarOpen && <span className="font-medium text-sm tracking-tight">Settings</span>}
            {activeTab === 'settings' && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-5 bg-white rounded-r-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="btn-ghost w-full !justify-start flex items-center gap-4 px-4 py-3.5 rounded-xl text-brand-500 hover:text-white hover:bg-white/5 group"
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
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn-icon p-2.5">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="h-4 w-px bg-white/[0.05]" />
            <h1 className="text-lg font-display font-bold text-white tracking-tight capitalize">
              {activeTab} <span className="text-brand-600 font-medium ml-2">/ Overview</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Beautiful Glowing Demo Mode Toggle */}
            <div
              className={cn(
                'flex items-center gap-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl px-4 py-2 transition-all relative overflow-hidden group',
                isCampaignRunning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/[0.03]',
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-amber-500/[0.03] transition-opacity duration-500',
                  demoMode && !isCampaignRunning ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Sparkles
                className={cn(
                  'w-4 h-4 transition-all duration-500 relative z-10',
                  isCampaignRunning
                    ? 'text-brand-700'
                    : demoMode
                      ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)] animate-pulse'
                      : 'text-brand-600',
                )}
              />
              <div className="flex flex-col items-start leading-none relative z-10">
                <span className="text-[10px] font-bold text-white tracking-tight">Demo Mode</span>
                <span className="text-[8px] font-mono text-brand-600 uppercase tracking-wider mt-0.5">
                  {isCampaignRunning ? 'LOCKED (RUNNING)' : demoMode ? 'SIMULATED' : 'LIVE ENGINE'}
                </span>
              </div>
              <button
                type="button"
                onClick={isCampaignRunning ? undefined : toggleDemoMode}
                disabled={isCampaignRunning}
                className={cn(
                  'w-9 h-5 rounded-full relative transition-colors duration-300 ml-1 flex items-center p-0.5 outline-none relative z-10',
                  isCampaignRunning ? 'cursor-not-allowed bg-white/5' : 'cursor-pointer',
                  !isCampaignRunning && demoMode ? 'bg-amber-500' : 'bg-white/10',
                )}
              >
                <motion.div
                  layout={true}
                  className={cn(
                    'w-4 h-4 rounded-full shadow-md',
                    isCampaignRunning ? 'bg-white/40' : 'bg-white',
                  )}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ marginLeft: demoMode ? '1rem' : '0rem' }}
                />
              </button>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white tracking-tight leading-none">
                {user?.displayName}
              </span>
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mt-1">
                Enterprise Access
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Users className="w-5 h-5 text-brand-500" />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 relative z-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="h-full max-w-none w-full"
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'prospector' && <Prospector />}
              {activeTab === 'leads' && <LeadsTable />}
              {activeTab === 'websites' && <WebsitesTracker />}
              {activeTab === 'outreach' && <OutreachTracker />}
              {activeTab === 'inbox' && <Inbox />}
              {activeTab === 'analyze' && <ImageAnalyzer />}
              {activeTab === 'deck' && <PitchDeck />}
              {activeTab === 'logs' && <CampaignLogs />}
              {activeTab === 'settings' && <SettingsComponent />}
            </motion.div>
          </AnimatePresence>
          <LeadAutomation />
        </div>
      </main>
    </div>
  );
}
