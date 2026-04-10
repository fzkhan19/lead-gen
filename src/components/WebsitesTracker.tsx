import { useState, useEffect } from 'react';
import { Globe, ExternalLink, Eye, Sparkles, Layout, Monitor, Smartphone, MapPin } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import WebsitePreview from './WebsitePreview';
import { cn } from '../lib/utils';

export default function WebsitesTracker() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', auth.currentUser.uid),
      where('status', 'in', ['outreach_sent', 'replied', 'closed']),
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
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Generated Ecosystem</h2>
          <p className="text-brand-500 font-medium mt-1">Real-time monitoring of AI-deployed digital assets.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.02] px-6 py-3 rounded-2xl border border-white/[0.03]">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest leading-none mb-1">Active Sites</span>
            <span className="text-xl font-display font-bold text-white leading-none">{leads.length}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.05]" />
          <Globe className="w-5 h-5 text-brand-400" />
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="glass p-24 text-center rounded-[40px] border border-white/[0.03]">
          <div className="w-20 h-20 bg-brand-900/50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/[0.03] animate-pulse-subtle">
            <Globe className="w-8 h-8 text-brand-700" />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-3">No Assets Deployed</h3>
          <p className="text-brand-600 max-w-xs mx-auto text-sm leading-relaxed">Launch an AI campaign from the leads table to generate and track websites here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {leads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="glass-card group overflow-hidden rounded-[40px] flex flex-col h-full"
            >
              {/* Preview Header */}
              <div className="relative h-56 bg-brand-950 overflow-hidden border-b border-white/[0.03]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-950/80 z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110">
                  <Globe className="w-24 h-24 text-brand-900" />
                </div>
                <div className="absolute top-6 right-6 z-20">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-white text-brand-950 shadow-xl">
                    {lead.designArchetype || 'Modern'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white tracking-tight group-hover:text-brand-200 transition-colors">{lead.businessName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-700" />
                      <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">{lead.city}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedLead(lead);
                    }}
                    className="w-12 h-12 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
                  >
                    <ExternalLink className="w-5 h-5 text-brand-500 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/[0.02]">
                    <p className="text-[9px] font-bold text-brand-700 uppercase tracking-widest mb-1">Setup</p>
                    <p className="text-lg font-display font-bold text-white">€{lead.offerPrice || '350'}</p>
                  </div>
                  <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/[0.02]">
                    <p className="text-[9px] font-bold text-brand-700 uppercase tracking-widest mb-1">Monthly</p>
                    <p className="text-lg font-display font-bold text-white">€{lead.subscriptionPrice || '10'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Live Asset</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedLead(lead);
                    }}
                    className="btn-sm btn-ghost"
                  >
                    Open Website
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedLead && (
          <WebsitePreview 
            html={selectedLead.generatedHtml || "<html><body style='background:#09090b;color:#a1a1aa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;'><h1>No preview available</h1></body></html>"} 
            businessName={selectedLead.businessName || 'Business'} 
            onClose={() => setSelectedLead(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
