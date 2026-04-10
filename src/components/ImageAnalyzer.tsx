import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Search, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function ImageAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            parts: [
              { text: "Analyze this image (business card, flyer, or storefront). Extract the following information in JSON format: Business Name, Niche, Address, Phone Number, Email, Website. If any field is missing, set it to null." },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAsLead = async () => {
    if (!result) return;

    try {
      const leadData = {
        uid: auth.currentUser?.uid,
        businessName: result.BusinessName || result.name || 'Unknown Business',
        address: result.Address || result.address || 'Unknown',
        phone: result.PhoneNumber || result.phone || 'Unknown',
        email: result.Email || result.email || null,
        website: result.Website || result.website || null,
        city: result.Address?.split(',').slice(-2, -1)[0]?.trim() || 'Unknown',
        niche: result.Niche || result.niche || 'Unknown',
        status: result.Website ? 'prospect' : 'qualified',
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'leads'), leadData);
        alert('Lead saved successfully!');
        setImage(null);
        setResult(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'leads');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass p-10 rounded-[40px] shadow-2xl border border-white/[0.03]">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-inner">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">Visual Lead Extractor</h2>
            <p className="text-brand-500 font-medium mt-1">Upload a business card or flyer to automatically extract lead data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                image ? "border-white/20" : "border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]"
              )}
            >
              {image ? (
                <>
                  <img src={image} className="w-full h-full object-cover" alt="Upload" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-white font-bold text-sm tracking-tight">Change Image</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-brand-800 mb-3" />
                  <p className="text-brand-700 font-bold text-sm tracking-tight">Click to upload or drag and drop</p>
                  <p className="text-[10px] text-brand-800 mt-2 font-mono uppercase tracking-widest">JPG, PNG up to 10MB</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <button 
              onClick={analyzeImage}
              disabled={!image || isAnalyzing}
              className="btn-lg btn-accent w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Extract Lead Data
                </>
              )}
            </button>
          </div>

          <div className="glass-dark border border-white/[0.03] rounded-3xl p-8 flex flex-col shadow-inner">
            <h3 className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] mb-8">Extraction Results</h3>
            
            {result ? (
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-700 uppercase tracking-widest">Business Name</label>
                  <p className="text-white font-bold text-lg tracking-tight">{result.BusinessName || result.name || 'Not found'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-700 uppercase tracking-widest">Niche</label>
                  <p className="text-brand-400 font-medium">{result.Niche || result.niche || 'Not found'}</p>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-700 uppercase tracking-widest">Contact Info</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-brand-500 font-medium">
                      <div className="w-8 h-8 bg-white/[0.02] rounded-lg flex items-center justify-center border border-white/[0.05]">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      {result.Phone || result.phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-brand-500 font-medium">
                      <div className="w-8 h-8 bg-white/[0.02] rounded-lg flex items-center justify-center border border-white/[0.05]">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      {result.Email || result.email || 'No email'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-brand-500 font-medium">
                      <div className="w-8 h-8 bg-white/[0.02] rounded-lg flex items-center justify-center border border-white/[0.05]">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      {result.Website || result.website || 'No website'}
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 mt-auto border-t border-white/[0.02]">
                  <button 
                    onClick={saveAsLead}
                    className="btn-lg btn-primary w-full"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Save as Qualified Lead
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6">
                <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-white/[0.03]">
                  <Sparkles className="w-6 h-6 text-brand-800" />
                </div>
                <p className="text-brand-700 text-sm font-medium leading-relaxed">Upload an image and run analysis to see results here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
