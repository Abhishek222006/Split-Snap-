import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, AtSymbolIcon, KeyIcon, UserIcon } from '@heroicons/react/24/outline';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('splitsnap_token', data.data.token);
      onLoginSuccess(data.data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-card p-1"
          >
            <div className="bg-[#020617]/40 backdrop-blur-2xl rounded-[1.4rem] p-8 border border-white/5 relative overflow-hidden">
              
              {/* Decorative Background Elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-[40px] pointer-events-none"></div>

              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/10 z-10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-display font-bold tracking-wide text-white mb-2 text-glow">
                  {isLogin ? 'WELCOME BACK' : 'JOIN SPLITSNAP'}
                </h2>
                <p className="text-indigo-200/60 font-light text-sm tracking-wider">
                  {isLogin ? 'Enter your credentials to access your ledger.' : 'Establish your identity for permanent splits.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                {!isLogin && (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="glass-input w-full pl-11 pr-4 py-3 rounded-xl transition-all font-light tracking-wide placeholder-slate-500"
                    />
                  </div>
                )}

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <AtSymbolIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl transition-all font-light tracking-wide placeholder-slate-500"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl transition-all font-light tracking-wide placeholder-slate-500"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-rose-400 text-sm font-light text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-indigo-600/80 text-white font-bold font-display tracking-widest uppercase text-sm py-4 rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] border border-indigo-500 mt-6"
                >
                  {loading ? 'Authenticating...' : (isLogin ? 'Access Ledger' : 'Create Identity')}
                </button>
              </form>

              <div className="mt-8 text-center relative z-10">
                <p className="text-slate-400 font-light text-sm tracking-wide">
                  {isLogin ? "No identity established?" : "Already hold access?"}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold font-display uppercase tracking-widest text-xs transition-colors ml-1"
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
