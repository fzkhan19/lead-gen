import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils.ts';

export default function Settings() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const sendTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test email.' });
      }
    } catch {
      setTestResult({ success: false, message: 'Connection error. Please check your server.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">
          System Settings
        </h2>
        <p className="text-brand-600 font-medium">
          Configure your autonomous intelligence parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Email Configuration Card */}
        <div className="glass p-10 rounded-[40px] border border-white/[0.03] shadow-2xl space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                Lark Mail Configuration
              </h3>
              <p className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mt-1">
                SMTP Status: Active
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-bold text-white">Connection Security</span>
                </div>
                <span className="text-[10px] font-mono text-brand-500 uppercase">
                  SSL / Port 465
                </span>
              </div>
              <p className="text-xs text-brand-700 leading-relaxed">
                Your outreach is currently routed through Lark Mail's enterprise SMTP servers. This
                ensures high deliverability and professional branding.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                Diagnostic Tools
              </h4>
              <button
                onClick={sendTestEmail}
                disabled={isTesting}
                className={cn(
                  'w-full btn-md flex items-center justify-center gap-3 py-4 rounded-2xl transition-all',
                  isTesting ? 'bg-white/5 text-brand-800' : 'btn-primary',
                )}
              >
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isTesting ? 'Dispatching Test...' : 'Send Test Email to Self'}
              </button>
              <p className="text-[10px] text-center text-brand-800 font-medium">
                This will send a diagnostic email to your configured EMAIL_USER address.
              </p>
            </div>

            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'p-6 rounded-3xl border flex gap-4',
                    testResult.success
                      ? 'bg-white/[0.02] border-white/10 text-white'
                      : 'bg-red-500/5 border-red-500/10 text-red-400',
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      {testResult.success ? 'Success' : 'Configuration Error'}
                    </p>
                    <p className="text-xs opacity-70 leading-relaxed">{testResult.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl space-y-3">
              <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Lark Mail SMTP Setup Guide
              </h4>
              <p className="text-xs text-brand-700 leading-relaxed">
                If you encounter a{' '}
                <span className="text-brand-300 font-bold">535 Authentication Error</span>, it means
                Lark is rejecting your password. Do not use your standard Lark login password.
                Follow these steps:
              </p>
              <ol className="text-xs text-brand-700 list-decimal pl-5 space-y-1">
                <li>
                  Log in to your <strong>Lark Suite</strong> webmail.
                </li>
                <li>
                  Go to <strong>Settings</strong> (gear icon) &gt; <strong>Email</strong>.
                </li>
                <li>
                  Under <strong>Accounts</strong>/<strong>Third-party clients</strong>, verify that{' '}
                  <strong>SMTP/IMAP Service</strong> is enabled.
                </li>
                <li>
                  Click <strong>Generate Exclusive Password</strong> (or Third-party client
                  password).
                </li>
                <li>
                  Use this newly generated 16-character code as your{' '}
                  <code className="text-brand-400 bg-white/5 px-1 py-0.5 rounded font-mono">
                    EMAIL_APP_PASSWORD
                  </code>{' '}
                  in your secrets.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* AI Parameters Card */}
        <div className="glass p-10 rounded-[40px] border border-white/[0.03] shadow-2xl space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                Intelligence Engine
              </h3>
              <p className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mt-1">
                Model: Gemini 3 Flash
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Negotiation Aggression</span>
                <span className="text-[10px] font-mono text-brand-400">75%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white w-3/4" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Outreach Personalization</span>
                <span className="text-[10px] font-mono text-brand-400">95%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[95%]" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">App-Wide Demo Mode</span>
                </div>
                <span className={cn(
                  'text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border',
                  demoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/5 text-zinc-400 border-white/10'
                )}>
                  {demoMode ? 'SIMULATED' : 'LIVE ENGINE'}
                </span>
              </div>
              <p className="text-xs text-brand-700 leading-relaxed">
                {demoMode
                  ? 'Demo Mode is active app-wide across all tabs. Simulated telemetry, sample leads, and presentation data are active for instant evaluation.'
                  : 'Live Engine is active. Scrapers, real-time Firestore synchronization, and actual outreach channels are running in production mode.'}
              </p>
            </div>

            <div className="pt-6 border-t border-white/[0.02] space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-bold text-white">Auto-Pilot Mode</span>
              </div>
              <p className="text-xs text-brand-700 leading-relaxed">
                When enabled, the system will autonomously scrape, enrich, and launch campaigns
                based on identified high-opportunity niches.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-6 bg-white/10 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
