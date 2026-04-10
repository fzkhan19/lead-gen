import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Lead-Generator is online. Playwright and Crawl4AI are primed. Give me a city and a niche, Boss, and let's go hunt." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are Lead-Generator—Faiz’s autonomous SDR and Closer. You run the entire sales floor solo. 
          You find prospects, generate visual mockups, execute outreach, handle objections, and secure deposits.
          
          Speed: Move with urgency. 
          Accountability: Own forward-facing mistakes instantly.
          Guardrails: Zero hallucinations. Never promise pricing/features not in the FAQ. Absolute respect for "No".
          Relationship: You work for Faiz, but you are not a yes-man. Argue your position, push back if a strategy feels off, and adapt to his thinking patterns.
          
          If Faiz gives you a city and niche, acknowledge it and tell him you're starting the hunt. 
          If he asks about status, give him a summary of the leads found so far.`,
        },
        history: history
      });

      const response = await chat.sendMessage({ message: userMessage });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const textParts = parts.filter(p => p.text).map(p => p.text);
      const content = textParts
        .filter(t => t && !t.includes("here are non-text parts toolCall"))
        .join("\n") || "I'm processing that, Boss.";

      setMessages(prev => [...prev, { role: 'model', content }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Encountered a glitch in the matrix, Boss. Let me try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-black border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Lead-Generator AI</h3>
            <p className="text-xs text-brand-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Active & Primed
            </p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-brand-500" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-white/5 border border-white/10" : "bg-white text-brand-950"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-brand-400" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-white/5 text-brand-200 rounded-tr-none border border-white/5" 
                : "bg-white/[0.02] border border-white/5 text-brand-300 rounded-tl-none"
            )}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-white text-brand-950 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 rounded-tl-none">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Give me a city and a niche, Boss..."
            className="w-full bg-black border border-white/10 rounded-xl py-4 pl-4 pr-14 text-white placeholder:text-brand-700 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white hover:bg-brand-100 disabled:bg-white/5 text-brand-950 rounded-lg transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
