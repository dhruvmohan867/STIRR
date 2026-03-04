"use client";

import { useState } from "react";
import { Search, Film, Star, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- WE ADDED THIS INTERFACE ---
interface AnalyzeResult {
  title: string;
  year: string;
  rating: string;
  poster: string;
  plot: string;
  cast: string;
  sentiment: string;
  classification: "positive" | "mixed" | "negative";
}

export default function Home() {
  const [imdbId, setImdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- WE CHANGED 'any' TO 'AnalyzeResult' HERE ---
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imdbId.trim().toLowerCase().startsWith("tt")) {
      setError("Please enter a valid IMDb ID starting with 'tt' (e.g., tt0133093)");
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imdbId: imdbId.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze sentiment.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze sentiment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl mb-4 border border-brand-500/20 shadow-[0_0_30px_rgba(106,94,255,0.15)]">
          <Film className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-brand-300 pb-2">
          IMDb Sentiment Analyzer
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
          Unlock the true audience reception. Enter an IMDb ID to get an AI-powered summary of thousands of user reviews.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-2xl relative"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-500/20 rounded-2xl blur-xl group-hover:bg-brand-500/30 transition-all duration-500" />
          <div className="relative flex items-center bg-slate-800/80 backdrop-blur-md border border-slate-700 hover:border-brand-500/50 rounded-2xl overflow-hidden transition-colors shadow-2xl">
            <div className="pl-6 pr-4 py-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              value={imdbId}
              onChange={(e) => setImdbId(e.target.value)}
              placeholder="e.g., tt0133093"
              className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder-slate-500 py-5 disabled:opacity-50 font-medium"
              disabled={loading}
            />
            <div className="pr-3 pl-2 py-3">
              <button 
                type="submit"
                disabled={loading || !imdbId.trim()}
                className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-600/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-10 left-0 w-full flex items-center justify-center gap-2 text-red-400 text-sm font-medium"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </motion.form>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && !loading && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="w-full mt-8 grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Movie Details Card */}
            <div className="md:col-span-5 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-brand-300" />
               <div className="flex gap-6">
                 {/* Poster */}
                 <div className="w-1/3 shrink-0 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 bg-slate-800 aspect-[2/3] relative">
                    {result.poster && result.poster !== 'N/A' ? (
                       <img src={result.poster} alt={result.title} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-600"><Film className="w-8 h-8" /></div>
                    )}
                 </div>
                 {/* Info */}
                 <div className="flex flex-col justify-center gap-2 flex-1">
                    <h2 className="text-2xl font-bold text-white leading-tight">{result.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-300">
                      <span className="bg-slate-700/50 px-2.5 py-1 rounded-md">{result.year}</span>
                      <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-current" /> {result.rating}
                      </span>
                    </div>
                 </div>
               </div>
               
               <div className="space-y-4 text-slate-300 border-t border-slate-700/50 pt-5">
                 <div>
                   <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Plot Summary</h3>
                   <p className="text-sm leading-relaxed">{result.plot}</p>
                 </div>
                 <div>
                   <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Cast</h3>
                   <p className="text-sm">{result.cast}</p>
                 </div>
               </div>
            </div>

            {/* AI Sentiment Card */}
            <div className="md:col-span-7 bg-brand-950/40 backdrop-blur-xl border border-brand-500/20 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden group">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all duration-700" />
               
               <div className="flex items-center justify-between border-b border-white/5 pb-5 z-10">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-brand-500/20 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-brand-300" />
                   </div>
                   <h3 className="text-lg font-semibold text-white">AI Sentiment Analysis</h3>
                 </div>
                 
                 {/* Classification Badge */}
                 <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border 
                    ${result.classification === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      result.classification === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {result.classification.toUpperCase()}
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-center z-10">
                 <p className="text-lg leading-relaxed text-slate-200 font-light italic">
                   "{result.sentiment}"
                 </p>
               </div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}