import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  PlusIcon,
  PlusCircleIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [people, setPeople] = useState([{ id: 'p1', name: 'Me' }]);
  const [newPersonName, setNewPersonName] = useState('');
  const [items, setItems] = useState([]); // This will hold unassigned and assigned items
  const [assignments, setAssignments] = useState({}); // { itemId: [personId1, personId2] }
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [vpa, setVpa] = useState(''); // UPI ID of the collector
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [smartSplitPrompt, setSmartSplitPrompt] = useState('');
  const [isSmartSplitting, setIsSmartSplitting] = useState(false);
  
  const [paidPeople, setPaidPeople] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('splitsnap_token');
    if (token) {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json())
        .then(data => {
            if (data.success) setUser(data.data);
        })
        .catch(() => localStorage.removeItem('splitsnap_token'));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('splitsnap_token');
    setUser(null);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setShowSplit(false);
      setIsSuccess(false);
      setPeople([{ id: 'p1', name: 'Me' }]);
      setItems([]);
      setAssignments({});
      setPaidPeople([]);
      setIsCheckoutOpen(false);
      setCheckoutData(null);
    }
  };

  const callExtractReceipt = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const base64Image = await fileToBase64(file);
      
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      
      const data = await response.json();
      
      setTimeout(() => {
        if (data.success && data.data) {
          setResult(data.data);
          const mappedItems = data.data.items.map((item, index) => ({
            ...item,
            id: `item-${index}`,
            confidence: item.confidence || 100
          }));
          setItems(mappedItems);
          // Auto-assign to "Me" by default
          const initialAssignments = {};
          mappedItems.forEach(item => {
            initialAssignments[item.id] = ['p1'];
          });
          setAssignments(initialAssignments);
        } else {
          alert('Failed backend response');
        }
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error extracting receipt:', error);
      alert(`AI Extraction Error: ${error.message}`);
      setLoading(false);
    }
  };

  const addPerson = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    setPeople([...people, { id: `p${Date.now()}`, name: newPersonName.trim(), items: [] }]);
    setNewPersonName('');
  };

  const removePerson = (id) => {
    if (people.length <= 1) return;
    setPeople(people.filter(p => p.id !== id));
    // Remove person from all assignments
    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach(itemId => {
      newAssignments[itemId] = newAssignments[itemId].filter(pid => pid !== id);
      // Ensure at least one person is assigned if possible, or leave empty
    });
    setAssignments(newAssignments);
  };

  const toggleAssignment = (itemId, personId) => {
    const current = assignments[itemId] || [];
    if (current.includes(personId)) {
        if (current.length === 1) return; // Must have one person
        setAssignments({ ...assignments, [itemId]: current.filter(p => p !== personId) });
    } else {
        setAssignments({ ...assignments, [itemId]: [...current, personId] });
    }
  };

  const handleItemChange = (id, field, value) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item
    );
    setItems(updated);
    const newTotal = updated.reduce((s, i) => s + i.price, 0);
    setResult({ ...result, items: updated, total: newTotal });
  };

  const getPersonSubtotal = (personId) => {
    return items.reduce((sum, item) => {
      const assigned = assignments[item.id] || [];
      if (assigned.includes(personId)) {
        return sum + (item.price / assigned.length);
      }
      return sum;
    }, 0);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const saveSplit = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    setIsSaving(true);
    const token = localStorage.getItem('splitsnap_token');
    
    try {
      const response = await fetch('/api/splits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor: result.vendor,
          total: result.total,
          data: { people, items, assignments }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Payment link copied to clipboard!');
  };

  const handleSmartSplit = async () => {
    if (!smartSplitPrompt.trim()) return;
    setIsSmartSplitting(true);
    const token = localStorage.getItem('splitsnap_token');
    
    try {
      const response = await fetch('/api/assignments/smart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          people,
          prompt: smartSplitPrompt
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
        setSmartSplitPrompt('');
      } else {
        throw new Error(data.error || 'Failed to apply rules');
      }
    } catch (error) {
      alert(`AI Split Error: ${error.message}`);
    } finally {
      setIsSmartSplitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaying(true);
    setTimeout(() => {
        setPaidPeople([...paidPeople, checkoutData.personId]);
        setIsPaying(false);
        setIsCheckoutOpen(false);
        setCheckoutData(null);
    }, 2000);
  };

  const generateUpiMessage = (personName, amount) => {
    const message = `Hey ${personName}! Here's the split for ${result.vendor}. You owe ₹${amount}. Pay here: upi://pay?pa=${vpa}&pn=${user?.name || 'SplitSnap'}&am=${amount}&cu=INR&tn=SplitSnap - ${result.vendor}`;
    return encodeURIComponent(message);
  };

  if (showLanding && !result) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen font-sans relative selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="mesh-bg"></div>
      <div className="mesh-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <div className="relative z-10">
        {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 md:px-8 py-4 rounded-full flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-white">
            SPLIT<span className="text-violet-400">SNAP</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-indigo-200">{user.name}</span>
              <button type="button" onClick={handleSignOut} className="text-slate-400 hover:text-rose-400 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-2 rounded-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative text-white font-semibold">Login / Sign up</span>
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={setUser} />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-16">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tight mb-6 leading-tight">
            Split the Bill, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 text-glow">
              Not the Friendship
            </span>
          </h2>
          <p className="text-lg text-indigo-200/70 font-light max-w-xl mx-auto">
            Upload your receipt. Let our AI instantly read the items, and drag-and-drop to split costs with mathematical precision. 
          </p>
        </motion.div>

        <div className={`grid ${showSplit ? 'lg:grid-cols-12' : 'md:grid-cols-2'} gap-8 items-start transition-all duration-700`}>
          
          {/* Upload Section */}
          <motion.div 
            layout
            className={`glass-card glass-card-hover p-1 flex flex-col ${showSplit ? 'hidden lg:flex lg:col-span-4' : ''}`}
          >
            <div className="p-8 flex-1 flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-[rgba(0,0,0,0.2)]">
              {!file ? (
                <label className="w-full h-72 border-2 border-dashed border-indigo-500/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-indigo-400 transition-all group">
                  <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <PhotoIcon className="w-10 h-10" />
                  </div>
                  <span className="text-indigo-100 font-medium font-display tracking-wide mb-2">Upload your receipt</span>
                  <span className="text-slate-400 text-sm font-light">JPG, PNG strictly</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="w-full relative rounded-2xl overflow-hidden group border border-white/10">
                  <img src={previewUrl} alt="Receipt preview" className="w-full h-72 object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <label className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full font-medium cursor-pointer hover:bg-white/20 transition-colors backdrop-blur-md">
                      Change Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={callExtractReceipt} 
                disabled={!file || loading}
                className={`mt-6 w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-semibold text-lg transition-all
                  ${file && !loading 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)] hover:-translate-y-1' 
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting Intelligence...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-5 h-5" />
                    Extract Data
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <div className={`flex flex-col gap-6 ${showSplit ? 'lg:col-span-8' : ''}`}>
            <AnimatePresence mode="wait">
              {!result && !loading && !isSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card h-full p-12 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-white/10"
                >
                  <DocumentTextIcon className="w-20 h-20 mb-6 text-white/5" />
                  <p className="font-light tracking-wide">Awaiting your receipt...</p>
                </motion.div>
              )}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card h-full p-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 border-2 border-indigo-900 border-t-indigo-400 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
                  <h3 className="text-xl font-display text-white mb-2">Claude AI Processing</h3>
                  <p className="text-indigo-300/60 font-light">Analyzing items and prices with high precision.</p>
                </motion.div>
              )}

              {result && !loading && !showSplit && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="p-8 border-b border-white/10 bg-gradient-to-r from-indigo-900/30 to-violet-900/30 flex justify-between items-end">
                    <div>
                      <p className="text-indigo-300/70 text-xs font-bold uppercase tracking-widest mb-2">Vendor Name</p>
                      <h3 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        {result.vendor}
                        <CheckCircleIcon className="w-6 h-6 text-indigo-400" />
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-300/70 text-xs font-bold uppercase tracking-widest mb-2">Total Amount</p>
                      <p className="text-4xl font-display font-light text-white">₹{result.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <ul className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2">
                      {items.map((item, idx) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={item.id} 
                          className="flex gap-4 items-center py-3 border-b border-white/5 group hover:bg-white/[0.02] px-4 rounded-lg transition-colors"
                        >
                          <div className="flex-1 flex flex-col gap-1">
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                              className="bg-transparent border-none text-slate-300 font-light group-hover:text-white transition-colors focus:outline-none focus:ring-0 w-full"
                            />
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    item.confidence > 85 ? 'bg-emerald-500/20 text-emerald-400' : 
                                    item.confidence > 60 ? 'bg-amber-500/20 text-amber-400'  : 
                                    'bg-rose-500/20 text-rose-400'
                                }`}>
                                    {item.confidence}% match
                                </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-white font-medium">
                            <span>₹</span>
                            <input 
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                              className="bg-transparent border-none text-right w-24 focus:outline-none focus:ring-0"
                            />
                          </div>
                        </motion.li>
                      ))}
                    </ul>

                    <button 
                      type="button"
                      onClick={() => setShowSplit(true)}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-4 rounded-2xl font-bold font-display tracking-widest uppercase transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                    >
                      <UserGroupIcon className="w-5 h-5" /> Execute Split Allocation
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Interactive Split View */}
              {showSplit && !isSuccess && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between glass-card p-6 gap-4">
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-3 tracking-wide">
                      <UserGroupIcon className="w-6 h-6 text-indigo-400"/> Participants
                    </h3>
                    <form onSubmit={addPerson} className="flex gap-3 w-full md:w-auto">
                      <input 
                        type="text" 
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        placeholder="Add member..."
                        className="glass-input px-5 py-2.5 rounded-xl w-full md:w-64 transition-all"
                      />
                      <button type="submit" className="bg-indigo-600/80 hover:bg-indigo-500 text-white px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </form>
                  </div>

                  {/* AI Smart Split Assistant */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-transparent"
                  >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <SparklesIcon className="w-5 h-5 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold mb-1">Smart Split Assistant</h4>
                            <p className="text-indigo-200/50 text-xs mb-4 italic">"Anush is vegetarian", "I am paying for drinks", "Split everything except non-veg items with Anush"</p>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={smartSplitPrompt}
                                    onChange={(e) => setSmartSplitPrompt(e.target.value)}
                                    placeholder="Type a rule..."
                                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSmartSplit()}
                                />
                                <button 
                                    onClick={handleSmartSplit}
                                    disabled={isSmartSplitting || !smartSplitPrompt.trim()}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase transition-all shrink-0"
                                >
                                    {isSmartSplitting ? 'Applying...' : 'Apply Rules'}
                                </button>
                            </div>
                        </div>
                    </div>
                  </motion.div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Items List */}
                    <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="glass-card p-5 border border-white/5 hover:border-white/20 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-white font-medium group-hover:text-indigo-300 transition-colors">{item.name}</h4>
                              <p className="text-xl font-display font-bold text-white mt-1">₹{item.price.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase tracking-tighter text-indigo-300/50 block mb-1">Split Between</span>
                              <span className="bg-indigo-500/10 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20">
                                {assignments[item.id]?.length || 0} People
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            {people.map(person => {
                              const isAssigned = assignments[item.id]?.includes(person.id);
                              return (
                                <button
                                  key={person.id}
                                  onClick={() => toggleAssignment(item.id, person.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                    isAssigned 
                                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:bg-white/10'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                    isAssigned ? 'bg-white text-indigo-600' : 'bg-slate-700 text-slate-400'
                                  }`}>
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium">{person.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="flex flex-col gap-6 sticky top-32">
                      <div className="glass-card p-6 border border-indigo-500/30 bg-indigo-900/10">
                        <h4 className="font-display font-bold text-indigo-100 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-indigo-400" />
                          Live Settlement State
                        </h4>
                        
                        <div className="space-y-4">
                          {people.map(person => {
                            const subtotal = getPersonSubtotal(person.id);
                            const totalReceiptSubtotal = items.reduce((s, i) => s + i.price, 0) || 1;
                            const totalWithTax = (subtotal / totalReceiptSubtotal) * (result?.total || 0);
                            
                            return (
                              <div key={person.id} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-slate-200 font-medium">{person.name}</span>
                                    {person.id !== 'p1' && (
                                      <button onClick={() => removePerson(person.id)} className="ml-2 text-rose-500/40 hover:text-rose-400 transition-colors">
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-white font-display font-bold tracking-tight">₹{totalWithTax.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-indigo-300/50 font-bold mb-1">Receipt Total</p>
                            <p className="text-white/40 text-sm line-through decoration-indigo-500/50">₹{result?.total?.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-indigo-300/50 font-bold mb-1">Allocated Sum</p>
                            <p className="text-2xl font-display font-bold text-indigo-400">
                                ₹{people.reduce((sum, p) => {
                                    const sub = getPersonSubtotal(p.id);
                                    const totalReceiptSub = items.reduce((s, i) => s + i.price, 0) || 1;
                                    return sum + (sub / totalReceiptSub) * (result?.total || 0);
                                }, 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={saveSplit}
                        disabled={isSaving}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold font-display uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] hover:-translate-y-1 active:scale-[0.98]"
                      >
                        {isSaving ? 'Synchronizing with Supabase...' : 'Confirm & Commit Ledger →'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card mt-8 p-12 flex flex-col items-center justify-center text-center w-full"
                >
                  <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircleIcon className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white mb-4">Ledger Committed!</h3>
                  <p className="text-indigo-200/70 font-light mb-8 max-w-md mx-auto">
                    Your split has been successfully tracked. Here is the final settlement including all proportional taxes and fees.
                  </p>
                  
                  <div className="w-full max-w-lg bg-black/40 rounded-3xl p-8 border border-white/10 mb-10 text-left shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <SparklesIcon className="w-20 h-20 text-indigo-400" />
                    </div>
                    
                    <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">My UPI ID (VPA)</p>
                        <input 
                            type="text" 
                            placeholder="e.g. user@okaxis" 
                            value={vpa}
                            onChange={(e) => setVpa(e.target.value)}
                            className="bg-transparent border-none text-white w-full focus:outline-none focus:ring-0 font-medium placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                      <span className="text-slate-400 font-display tracking-widest text-sm uppercase">Participant</span>
                      <span className="text-slate-400 font-display tracking-widest text-sm uppercase text-right">Settlement</span>
                    </div>
                    
                    <ul className="space-y-6">
                      {people.map(p => {
                        const subtotal = getPersonSubtotal(p.id);
                        const finalOwed = (subtotal / (items.reduce((s, i) => s + i.price, 0) || 1)) * (result?.total || 0);
                        if (finalOwed <= 0 || p.id === 'p1') return null;
                        
                        const upiLink = `upi://pay?pa=${vpa}&pn=${user?.name || 'SplitSnap'}&am=${finalOwed.toFixed(2)}&cu=INR&tn=SplitSnap - ${result.vendor}`;

                        const isPaid = paidPeople.includes(p.id);

                          return (
                          <li key={p.id} className="flex flex-col gap-3 group">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium text-lg">{p.name}</span>
                                    {isPaid && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">● Paid</span>}
                                </div>
                                </div>
                                <span className={`font-display font-bold text-2xl tracking-tight transition-colors ${isPaid ? 'text-emerald-400' : 'text-white group-hover:text-indigo-400'}`}>
                                ₹{finalOwed.toFixed(2)}
                                </span>
                            </div>
                            
                            {!isPaid && (
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => {
                                            setCheckoutData({ personId: p.id, personName: p.name, amount: finalOwed.toFixed(2) });
                                            setIsCheckoutOpen(true);
                                        }}
                                        className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/30 transition-all flex items-center gap-2"
                                    >
                                        <SparklesIcon className="w-3 h-3" /> Pay Now
                                    </button>
                                    <button 
                                        onClick={() => copyToClipboard(upiLink)}
                                        className="text-[10px] uppercase font-bold tracking-widest bg-white/5 hover:bg-white/10 text-indigo-300 px-3 py-1.5 rounded-full border border-white/10 transition-all"
                                    >
                                        Copy Link
                                    </button>
                                    <a 
                                        href={`https://wa.me/?text=${generateUpiMessage(p.name, finalOwed.toFixed(2))}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-all"
                                    >
                                        WhatsApp
                                    </a>
                                </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    <div className="mt-10 pt-6 border-t border-white/20 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent -mx-8 px-8">
                      <span className="text-indigo-300 font-bold text-lg uppercase tracking-widest font-display">Grand Total</span>
                      <span className="text-indigo-300 font-display font-bold text-4xl text-glow">₹{result?.total?.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setFile(null);
                      setPreviewUrl(null);
                      setResult(null);
                      setShowSplit(false);
                      setPeople([{ id: 'p1', name: 'Me' }]);
                      setItems([]);
                      setAssignments({});
                    }}
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  >
                    Process Another Receipt →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Checkout Modal Simulation */}
      <AnimatePresence>
        {isCheckoutOpen && checkoutData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm glass-card overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-indigo-500/30"
                >
                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <span className="font-bold tracking-tight">SplitSnap Checkout</span>
                            </div>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
                        </div>
                        <p className="text-indigo-100/70 text-xs font-bold uppercase tracking-widest mb-1">Paying for {checkoutData.personName}</p>
                        <h2 className="text-4xl font-display font-bold">₹{checkoutData.amount}</h2>
                    </div>

                    <div className="p-6 space-y-4 bg-black/40">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">UPI Payment</p>
                                    <p className="text-slate-400 text-[10px]">Google Pay, PhonePe, Paytm</p>
                                </div>
                            </div>
                            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            </div>
                        </div>

                        <button 
                            onClick={handlePaymentSuccess}
                            disabled={isPaying}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3
                                ${isPaying ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'}`}
                        >
                            {isPaying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </>
                            ) : `Pay ₹${checkoutData.amount}`}
                        </button>
                        <p className="text-[10px] text-center text-slate-500 font-medium">Secured by SplitSnap Fintech Engine v2.0</p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
