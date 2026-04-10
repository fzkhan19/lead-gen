import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, Clock, Zap, Sparkles, Filter, Download, MessageSquare } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function OutreachTracker() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', auth.currentUser.uid),
      where('status', 'in', ['outreach_sent', 'replied']),
      orderBy('outreachSentAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Outreach Intelligence</h2>
          <p className="text-brand-500 font-medium mt-1">Real-time monitoring of sent proposals and client interactions.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-sm btn-secondary">
            <Download className="w-4 h-4" /> Export Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Sent Proposals', value: leads.length, icon: Send, color: 'text-brand-400' },
          { label: 'Total Value', value: `€${leads.reduce((acc, l) => acc + (l.offerPrice || 0), 0)}`, icon: Zap, color: 'text-brand-400' },
          { label: 'Replies', value: leads.filter(l => l.status === 'replied').length, icon: MessageSquare, color: 'text-brand-400' },
          { label: 'Avg. Response', value: '2.4h', icon: Clock, color: 'text-brand-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card p-8 rounded-[40px] flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-white/[0.05] group-hover:border-white/[0.1] transition-all">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/[0.03] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.03]">
                <th className="px-10 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Business Entity</th>
                <th className="px-10 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Sent At</th>
                <th className="px-10 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Last Attempt</th>
                <th className="px-10 py-6 text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1.5">
                      <div className="font-bold text-white tracking-tight text-base group-hover:text-brand-200 transition-colors">{lead.businessName}</div>
                      <div className="text-[11px] font-medium text-brand-600 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 opacity-50" /> {lead.email || 'No email detected'}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-sm font-medium text-brand-400">
                      {lead.outreachSentAt?.toDate ? lead.outreachSentAt.toDate().toLocaleString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-sm font-medium text-brand-400">
                      {lead.last_outreach_attempt?.toDate ? lead.last_outreach_attempt.toDate().toLocaleString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-xl border flex items-center gap-2.5",
                        lead.status === 'replied' 
                          ? "bg-white/[0.02] text-white border-white/[0.1]" 
                          : "bg-white/[0.01] text-brand-500 border-white/[0.03]"
                      )}>
                        {lead.status === 'replied' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {leads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-white/[0.02] rounded-[32px] flex items-center justify-center border border-white/[0.03]">
                        <Send className="w-8 h-8 text-brand-800" />
                      </div>
                      <p className="text-brand-600 font-medium max-w-xs mx-auto text-sm leading-relaxed">No outreach campaigns tracked yet. Launch a campaign from the leads table.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
