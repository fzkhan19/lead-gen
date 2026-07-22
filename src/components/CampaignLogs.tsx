import { collection, onSnapshot, query, where, orderBy, deleteDoc, getDocs } from 'firebase/firestore';
import {
  Activity,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Trash2,
  Clock,
  Search,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase.ts';
import { cn } from '../lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { CampaignLog } from '../services/logService.ts';

export default function CampaignLogs() {
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);

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

  const DEMO_LOGS: CampaignLog[] = [
    {
      id: 'demo-log-1',
      uid: 'demo-uid',
      leadName: 'Boutique Pâtisserie Paris',
      action: 'Prospect Reply Received',
      status: 'success',
      message: '[Demo Mode] Prospect Pierre replied: "The preview looks fantastic. Can we integrate our booking form?"',
      timestamp: { toDate: () => new Date(Date.now() - 43200000) } as any,
    },
    {
      id: 'demo-log-2',
      uid: 'demo-uid',
      leadName: 'Boutique Pâtisserie Paris',
      action: 'SMTP Outbox Transmission',
      status: 'success',
      message: '[Demo Mode] Pitch email delivered to contact@patisserie-paris.fr. Value: €349 setup + €19/mo hosting.',
      timestamp: { toDate: () => new Date(Date.now() - 86400000) } as any,
    },
    {
      id: 'demo-log-3',
      uid: 'demo-uid',
      leadName: 'L\'Atelier Boulangerie Lyon',
      action: 'AI Web Generator',
      status: 'info',
      message: '[Demo Mode] Responsive landing page compiled using "editorial" design profile.',
      timestamp: { toDate: () => new Date(Date.now() - 129600000) } as any,
    },
    {
      id: 'demo-log-4',
      uid: 'demo-uid',
      leadName: 'AI Market Prospector',
      action: 'Playwright OSINT Sweep',
      status: 'info',
      message: '[Demo Mode] Scanned 12 artisan bakery targets across Paris & Île-de-France.',
      timestamp: { toDate: () => new Date(Date.now() - 172800000) } as any,
    },
  ];

  const effectiveLogs = demoMode
    ? [...logs, ...DEMO_LOGS.filter((dl) => !logs.some((l) => l.id === dl.id))]
    : logs;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'campaign_logs'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CampaignLog[];
        setLogs(fetchedLogs);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to stream logs:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleClearLogs = async () => {
    const user = auth.currentUser;
    if (!user || logs.length === 0) return;

    if (!window.confirm('Are you sure you want to permanently clear all campaign logs?')) {
      return;
    }

    setIsClearing(true);
    try {
      const q = query(collection(db, 'campaign_logs'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = effectiveLogs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.leadName && log.leadName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: CampaignLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusBg = (status: CampaignLog['status']) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
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
      {/* Top action cards & search controls */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch justify-between">
        {/* Search & filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, messages, or leads..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white focus:outline-none focus:border-white/10 placeholder:text-brand-800 transition-colors font-medium"
            />
          </div>

          <div className="flex bg-white/[0.01] border border-white/5 p-1 rounded-2xl">
            {(['all', 'info', 'success', 'warning', 'error'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  statusFilter === status
                    ? 'bg-white/10 text-white'
                    : 'text-brand-500 hover:text-brand-300'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClearLogs}
          disabled={logs.length === 0 || isClearing}
          className="btn-md btn-ghost border border-white/5 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 px-6 shrink-0 h-full flex items-center justify-center gap-2 text-brand-500"
        >
          <Trash2 className="w-4 h-4" />
          {isClearing ? 'Clearing...' : 'Clear All Logs'}
        </button>
      </div>

      {/* Logs Table / List */}
      <div className="glass rounded-[40px] border border-white/[0.03] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/[0.02] bg-white/[0.01] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-xl text-white tracking-tight flex items-center gap-3">
              <Activity className="w-5 h-5 text-brand-400" />
              Campaign Event Stream
            </h3>
            <p className="text-xs text-brand-600 font-medium mt-1">
              Real-time chronological log of automation runs, outreaches, negotiations, and closures.
            </p>
          </div>
          <span className="text-[10px] font-mono text-brand-500 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5 font-bold">
            {filteredLogs.length} EVENTS MATCHED
          </span>
        </div>

        <div className="divide-y divide-white/[0.02] max-h-[600px] overflow-y-auto scrollbar-hide">
          <AnimatePresence initial={false}>
            {filteredLogs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-20 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-white/[0.01] rounded-3xl flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                  <Clock className="w-6 h-6 text-brand-800" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-bold text-lg">No event logs matching filters</h4>
                  <p className="text-brand-600 font-medium max-w-xs mx-auto text-sm">
                    Events will stream in live as campaigns are launched, emails are verified, or deals are closed.
                  </p>
                </div>
              </motion.div>
            ) : (
              filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 flex items-start sm:items-center gap-6 hover:bg-white/[0.01] transition-all"
                >
                  {/* Status pill icon */}
                  <div className={cn('p-3 rounded-2xl border shrink-0 shadow-inner', getStatusBg(log.status))}>
                    {getStatusIcon(log.status)}
                  </div>

                  {/* Core details */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-3">
                      <span className="text-[10px] font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 uppercase tracking-wide inline-block">
                        {log.action}
                      </span>
                      {log.leadName && (
                        <p className="text-xs font-bold text-brand-300 mt-1.5 truncate">
                          {log.leadName}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-7">
                      <p className="text-sm font-medium text-brand-100 leading-relaxed">
                        {log.message}
                      </p>
                    </div>

                    <div className="sm:col-span-2 text-left sm:text-right flex items-center sm:justify-end gap-2 text-brand-600 font-mono text-[10px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {log.timestamp?.toDate
                          ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
