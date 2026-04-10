import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Sparkles, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { analyzeAndReply, simulateIncomingReply } from '../services/negotiatorService';

export default function Inbox() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', auth.currentUser.uid),
      where('status', 'in', ['replied', 'outreach_sent']),
      orderBy('last_outreach_attempt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(allLeads);
      setLoading(false);
      
      // Update selected lead if it exists in the new data
      if (selectedLead) {
        const updated = allLeads.find(l => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });
    return unsubscribe;
  }, [selectedLead?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead?.messages]);

  const handleManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      const leadRef = doc(db, 'leads', selectedLead.id);
      const newMessage = {
        role: 'user',
        content: replyText,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(leadRef, {
        messages: arrayUnion(newMessage)
      });
      setReplyText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${selectedLead.id}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateReply = async (lead: any) => {
    const reply = await simulateIncomingReply(lead.id, lead.businessName);
    await analyzeAndReply(lead, reply);
  };

  const closeDeal = async (lead: any) => {
    try {
      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, {
        status: 'closed',
        closedAt: new Date().toISOString()
      });
      alert(`Deal closed with ${lead.businessName}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
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
    <div className="h-[calc(100vh-200px)] flex gap-10">
      {/* Sidebar: Conversations List */}
      <div className="w-96 glass rounded-[40px] flex flex-col overflow-hidden border border-white/[0.03] shadow-2xl">
        <div className="p-8 border-b border-white/[0.02] bg-white/[0.01] flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            Negotiation Hub
          </h3>
          <button 
            onClick={async () => {
              for (const lead of leads) {
                if (lead.status === 'outreach_sent' && (!lead.messages || lead.messages.length === 0)) {
                  await handleSimulateReply(lead);
                }
              }
            }}
            className="text-[9px] font-bold text-brand-500 hover:text-white uppercase tracking-widest transition-all"
          >
            Simulate All
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02]">
          {leads.length === 0 ? (
            <div className="p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-white/[0.02] rounded-3xl flex items-center justify-center mx-auto border border-white/[0.03]">
                <Clock className="w-6 h-6 text-brand-800" />
              </div>
              <p className="text-brand-600 font-medium text-sm">No active negotiations.</p>
            </div>
          ) : (
            leads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:bg-white/[0.02] group relative",
                  selectedLead?.id === lead.id ? "bg-white/[0.03] border-l-4 border-brand-400" : "border-l-4 border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white tracking-tight group-hover:text-brand-200 transition-colors truncate pr-4">
                    {lead.businessName}
                  </h4>
                  {lead.status === 'replied' && (
                    <span className="w-2 h-2 bg-brand-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </div>
                <p className="text-[10px] font-mono text-brand-600 uppercase tracking-widest mb-3">{lead.niche}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-brand-400 bg-white/[0.03] px-2 py-1 rounded-lg">
                    €{lead.offerPrice} + €{lead.subscriptionPrice}/mo
                  </span>
                  {!lead.messages?.length && lead.status === 'outreach_sent' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateReply(lead);
                      }}
                      className="text-[9px] font-bold text-brand-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Simulate Reply
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 glass rounded-[40px] flex flex-col overflow-hidden border border-white/[0.03] shadow-2xl">
        {selectedLead ? (
          <>
            {/* Header */}
            <div className="p-8 border-b border-white/[0.02] bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-950 rounded-2xl flex items-center justify-center border border-white/[0.03] shadow-inner">
                  <span className="font-display font-bold text-xl text-brand-500">{selectedLead.businessName[0]}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white tracking-tight">{selectedLead.businessName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">{selectedLead.email}</span>
                    <div className="w-1 h-1 bg-brand-800 rounded-full" />
                    <span className="text-[10px] font-mono text-brand-600 uppercase tracking-widest">{selectedLead.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Current Offer</p>
                  <p className="text-xl font-display font-bold text-white tracking-tight">€{selectedLead.offerPrice} + €{selectedLead.subscriptionPrice}/mo</p>
                </div>
                <button 
                  onClick={() => closeDeal(selectedLead)}
                  className="btn-md btn-accent px-8"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close Deal
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
              {/* Initial Outreach Message */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-3">
                  <div className="flex items-center gap-3 text-brand-600 mb-1">
                    <Bot className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Outreach</span>
                    <span className="text-[10px] font-mono">{selectedLead.outreachSentAt?.toDate?.()?.toLocaleTimeString() || 'Sent'}</span>
                  </div>
                  <div className="glass-dark p-6 rounded-3xl rounded-tl-none border border-white/[0.03] text-brand-200 text-sm leading-relaxed">
                    Hello {selectedLead.businessName} team, we've built a custom website mockup for you. It's ready to launch for just €{selectedLead.offerPrice} setup and €{selectedLead.subscriptionPrice}/mo. Would you like to see it?
                  </div>
                </div>
              </div>

              {selectedLead.messages?.map((msg: any, i: number) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[80%] space-y-3", msg.role === 'user' ? "" : "text-right")}>
                    <div className={cn("flex items-center gap-3 text-brand-600 mb-1", msg.role === 'user' ? "" : "flex-row-reverse")}>
                      {msg.role === 'user' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {msg.role === 'user' ? 'AI Negotiator' : selectedLead.businessName}
                      </span>
                      <span className="text-[10px] font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={cn(
                      "p-6 rounded-3xl text-sm leading-relaxed border",
                      msg.role === 'user' 
                        ? "glass-dark rounded-tl-none border-white/[0.03] text-brand-200" 
                        : "bg-white/[0.05] rounded-tr-none border-white/[0.1] text-white shadow-lg"
                    )}>
                      {msg.content}
                      {msg.sentiment && (
                        <div className="mt-4 pt-4 border-t border-white/[0.02] flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Sentiment: {msg.sentiment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white/[0.01] border-t border-white/[0.02]">
              <form onSubmit={handleManualReply} className="flex gap-4">
                <input 
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a manual response or let AI handle it..."
                  className="flex-1 bg-brand-950/50 border border-white/[0.03] rounded-2xl py-4 px-6 text-white focus:border-white/[0.1] focus:ring-4 focus:ring-white/[0.02] outline-none transition-all placeholder:text-brand-800 font-medium"
                />
                <button 
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="btn-md btn-secondary px-8"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
              <div className="mt-4 flex items-center gap-3 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI Negotiation Guard is active. Every response is optimized for conversion.
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-8">
            <div className="w-24 h-24 bg-white/[0.02] rounded-[40px] flex items-center justify-center border border-white/[0.03] shadow-inner">
              <MessageSquare className="w-10 h-10 text-brand-800" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-display font-bold text-white tracking-tight">Select a Conversation</h3>
              <p className="text-brand-600 font-medium max-w-sm mx-auto leading-relaxed">
                Choose a lead from the sidebar to start negotiating and closing deals.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
