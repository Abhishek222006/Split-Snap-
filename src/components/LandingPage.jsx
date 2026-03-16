import React from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const LandingPage = ({ onStart }) => {
  const features = [
    {
      title: "AI Receipt Extraction",
      desc: "Instant data capture with ultra-high precision using gpt-4o-mini.",
      icon: DocumentTextIcon,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Natural Language Splitting",
      desc: "Just say 'Rahul is vegetarian' and let the AI handle the rest.",
      icon: SparklesIcon,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Smart Group Ledger",
      desc: "Real-time settlement tracking for you and your friends.",
      icon: UserGroupIcon,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Integrated Payments",
      desc: "Premium native checkout simulation with real-time Paid status.",
      icon: ShieldCheckIcon,
      color: "from-orange-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter uppercase italic">SplitSnap</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="flex flex-col items-center text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8"
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">New: Smart AI Splitting v2.0</span>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-6xl md:text-8xl font-display font-black tracking-tight mb-8 leading-[0.9]"
            >
                <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">SPLIT LESS.</span><br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent italic">SNAP MORE.</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed"
            >
                The world's most intelligent bill splitter. Upload any receipt and let AI handle the dietary preferences, alcohol splits, and settlements automatically.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
                <button 
                    onClick={onStart}
                    className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group"
                >
                    Get Started Free <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32">
            {features.map((f, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                    className="p-8 glass-card border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg`}>
                        <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">{f.desc}</p>
                </motion.div>
            ))}
        </div>
      </main>

      {/* Footer Simulation */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 opacity-50">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-display font-black tracking-tighter uppercase italic">SplitSnap</span>
            </div>
            <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
                <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
            </div>
            <p className="text-xs text-slate-600 font-medium">© 2026 SplitSnap Intelligent Systems.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
