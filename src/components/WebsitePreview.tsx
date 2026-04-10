import { motion } from 'motion/react';
import { Globe, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { useState } from 'react';

interface WebsitePreviewProps {
  html: string;
  businessName: string;
  onClose: () => void;
}

export default function WebsitePreview({ html, businessName, onClose }: WebsitePreviewProps) {
  const [view, setView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Toolbar */}
      <div className="h-16 bg-black border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{businessName} - AI Mockup</h3>
            <p className="text-[10px] text-brand-500 font-mono uppercase tracking-widest">Live Preview Mode</p>
          </div>
        </div>

        <div className="flex items-center bg-black rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => setView('desktop')}
            className={`p-2 rounded-lg transition-all ${view === 'desktop' ? 'bg-white text-brand-950' : 'text-brand-500 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setView('tablet')}
            className={`p-2 rounded-lg transition-all ${view === 'tablet' ? 'bg-white text-brand-950' : 'text-brand-500 hover:text-white'}`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setView('mobile')}
            className={`p-2 rounded-lg transition-all ${view === 'mobile' ? 'bg-white text-brand-950' : 'text-brand-500 hover:text-white'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg text-brand-500 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-brand-950 p-8 overflow-hidden flex justify-center">
        <motion.div 
          layout
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
            view === 'desktop' ? 'w-full max-w-6xl' : 
            view === 'tablet' ? 'w-[768px]' : 'w-[375px]'
          }`}
        >
          <iframe 
            srcDoc={html} 
            title="AI Generated Website"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
