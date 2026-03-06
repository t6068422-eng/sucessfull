import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  ClipboardList, 
  Gamepad2, 
  Gift, 
  Ticket, 
  Wallet, 
  Lock, 
  Coins, 
  TrendingUp, 
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Menu,
  RefreshCw,
  ChevronRight,
  Trophy,
  Flame,
  Star,
  Zap,
  Megaphone,
  Code,
  Save
} from 'lucide-react';
import { User, Task, AppSettings } from './types';

// --- Components ---

const AdComponent = ({ placement }: { placement: string }) => {
  const [adCode, setAdCode] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('disable_ads') === 'true') {
      console.log(`Ads disabled for ${placement} via query parameter.`);
      return;
    }

    fetch('/api/ads')
      .then(r => r.json())
      .then(ads => {
        if (ads[placement]) {
          setAdCode(ads[placement]);
        }
      });
  }, [placement]);

  const lastInjectedCode = useRef<string | null>(null);

  useEffect(() => {
    if (adCode && containerRef.current && adCode !== lastInjectedCode.current) {
      console.log(`Injecting ad for ${placement}...`);
      lastInjectedCode.current = adCode;
      // Clear existing content
      containerRef.current.innerHTML = '';
      
      // Create a range to parse the HTML and scripts
      const range = document.createRange();
      const documentFragment = range.createContextualFragment(adCode);
      
      // Append the fragment
      containerRef.current.appendChild(documentFragment);

      // Manually execute scripts if they weren't executed
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr: Attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [adCode]);

  if (!adCode) return null;

  return (
    <div 
      ref={containerRef} 
      className="ad-container flex justify-center my-8 overflow-hidden min-h-[50px] w-full"
      data-placement={placement}
    />
  );
};

const Navbar = ({ coins, activeTab, setActiveTab, withdrawalsEnabled, onRefresh }: { coins: number, activeTab: string, setActiveTab: (t: string) => void, withdrawalsEnabled: boolean, onRefresh: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'daily', label: 'Daily', icon: Gift },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'withdraw', label: 'Withdraw', icon: Wallet, hidden: !withdrawalsEnabled },
  ].filter(item => !item.hidden);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            TeleX <span className="text-secondary">(TLX)</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                activeTab === item.id 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-white/10 rounded-lg -z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                />
              )}
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className={`p-2 glass rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin text-primary' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>

          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <Coins size={12} className="text-white" />
            </div>
            <span className="font-mono font-bold text-sm">{coins.toLocaleString()} TLX</span>
          </div>
          
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass border-b border-white/5 p-4 flex flex-col gap-2"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 ${
                  activeTab === item.id ? 'bg-white/10 text-white' : 'text-white/60'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const HomePage = ({ onStart, onRefresh }: { onStart: (tab: string) => void, onRefresh: () => void, key?: string }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-6">
            <TrendingUp size={14} />
            <span>#1 Crypto Earning Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-bold leading-tight mb-6">
            Earn Crypto. <br />
            <span className="gradient-text">Play Games.</span> <br />
            Complete Tasks.
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-lg leading-relaxed">
            Join thousands of users earning TLX coins daily. Withdraw to your favorite crypto wallet or PayPal instantly.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onStart('tasks')}
              className="px-8 py-4 gradient-bg rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            >
              Start Earning
            </button>
            <button 
              onClick={() => onStart('games')}
              className="px-8 py-4 glass rounded-2xl font-bold hover:bg-white/20 transition-all"
            >
              Play Games
            </button>
            <button 
              onClick={handleRefresh}
              className={`px-8 py-4 glass rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-2 ${isRefreshing ? 'text-primary' : ''}`}
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

        <div className="mt-12 flex items-center gap-8">
          <div>
            <div className="text-2xl font-bold">50K+</div>
            <div className="text-sm text-white/40">Active Users</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-2xl font-bold">1.2M+</div>
            <div className="text-sm text-white/40">Coins Paid</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-2xl font-bold">150+</div>
            <div className="text-sm text-white/40">Daily Tasks</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full" />
        
        <div className="relative glass rounded-[2.5rem] p-8 border-white/10 shadow-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-3xl flex flex-col items-center gap-3 animate-float">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <Coins className="text-yellow-500" />
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">100 TLX</div>
                <div className="text-xs text-white/40">Daily Bonus</div>
              </div>
            </div>
            <div className="glass p-6 rounded-3xl flex flex-col items-center gap-3 animate-float [animation-delay:1s]">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-500" />
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">+25%</div>
                <div className="text-xs text-white/40">Referral Bonus</div>
              </div>
            </div>
            <div className="col-span-2 glass p-6 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Trophy className="text-primary" />
                </div>
                <div>
                  <div className="font-bold">Weekly Leaderboard</div>
                  <div className="text-xs text-white/40">Top 10 win extra prizes</div>
                </div>
              </div>
              <ChevronRight className="text-white/20" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    <AdComponent placement="home_middle" />
  </div>
  );
};

const TasksPage = ({ tasks, onComplete, onRefresh }: { tasks: (Task & { completed?: number })[], onComplete: (t: Task) => void, onRefresh: () => void, key?: string }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If tasks is an array (even empty), we've finished loading
    if (Array.isArray(tasks)) {
      setLoading(false);
    }
  }, [tasks]);

  useEffect(() => {
    let timer: any;
    if (activeTask && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (activeTask && timeLeft === 0) {
      // Task ready to be claimed
    }
    return () => clearInterval(timer);
  }, [activeTask, timeLeft]);

  const handleStart = (task: Task) => {
    setActiveTask(task);
    setTimeLeft(5);
    if (task.link) {
      let url = task.link;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Popup blocked or failed:', e);
      }
    }
  };

  const handleClaim = () => {
    if (activeTask) {
      onComplete(activeTask);
      setActiveTask(null);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold mb-2">Available Tasks</h2>
          <p className="text-white/60">Complete simple tasks to earn TLX coins instantly.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="px-6 py-3 glass rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5"
        >
          <RefreshCw size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Refresh</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="glass p-6 rounded-3xl h-64 animate-pulse bg-white/5" />
              ))
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -5 }}
                  className={`glass p-6 rounded-3xl border-white/5 hover:border-white/20 transition-all group ${task.completed ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardList className="text-primary" />
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      {task.reward} TLX
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/40 mb-6">
                    <div className="flex items-center gap-1">
                      <Zap size={14} />
                      <span>{task.time_estimate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{task.category}</span>
                    </div>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    disabled={!!task.completed}
                    onClick={() => handleStart(task)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10 disabled:cursor-not-allowed"
                  >
                    {task.completed ? 'Completed' : 'Start Task'}
                  </motion.button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-white/40">No tasks available at the moment.</div>
            )}
          </div>
        </div>
        
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-24">
            <div className="glass p-6 rounded-3xl mb-6">
              <h3 className="text-lg font-bold mb-4">Sponsored</h3>
              <AdComponent placement="tasks_sidebar" />
            </div>
          </div>
        </div>
      </div>

      <AdComponent placement="tasks_bottom" />

      <AnimatePresence>
        {activeTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border-white/10 text-center">
              <h3 className="text-2xl font-bold mb-4">{activeTask.title}</h3>
              <p className="text-white/60 mb-8">Please stay on this page for {timeLeft} more seconds to claim your reward.</p>
              
              <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl font-bold">{timeLeft}</span>
              </div>

              {activeTask.link && (
                <a 
                  href={activeTask.link.startsWith('http') ? activeTask.link : `https://${activeTask.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 mb-4 bg-primary/20 text-primary rounded-xl font-bold border border-primary/20 hover:bg-primary/30 transition-all"
                >
                  Visit Task Link
                </a>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTask(null)}
                  className="flex-1 py-4 glass rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  disabled={timeLeft > 0}
                  onClick={handleClaim}
                  className="flex-1 py-4 gradient-bg rounded-xl font-bold disabled:opacity-50"
                >
                  Claim Reward
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Games ---

const SpinWheel = ({ onWin, onPlay, userId }: { onWin: (amount: number) => void, onPlay: () => Promise<boolean>, userId: string }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [playsLeft, setPlaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/games/plays?userId=${userId}&gameId=spin`)
        .then(r => r.json())
        .then(data => setPlaysLeft(10 - data.count))
        .catch(err => console.error("Failed to fetch plays:", err));
    }
  }, [userId]);

  const segments = [
    { val: 0, color: 'bg-slate-500' },
    { val: 10, color: 'bg-blue-500' },
    { val: 20, color: 'bg-purple-500' },
    { val: 50, color: 'bg-emerald-500' },
    { val: 100, color: 'bg-orange-500' },
    { val: 200, color: 'bg-rose-500' }
  ];

  const spin = async () => {
    if (spinning || !userId) return;
    if (playsLeft !== null && playsLeft <= 0) {
      alert("Daily limit reached! Come back tomorrow.");
      return;
    }

    // Charge the fee first
    const success = await onPlay();
    if (!success) return;

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameId: 'spin' })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      setSpinning(true);
      setResult(null);
      
      const extraDegrees = Math.floor(Math.random() * 360);
      const newRotation = rotation + 1800 + extraDegrees;
      setRotation(newRotation);

      setTimeout(() => {
        setSpinning(false);
        setPlaysLeft(prev => prev !== null ? prev - 1 : null);
        
        const actualRotation = newRotation % 360;
        const segmentIndex = Math.floor(((360 - actualRotation) % 360) / 60);
        const win = segments[segmentIndex].val;
        
        setResult(win);
        if (win > 0) onWin(win);
      }, 3000);
    } catch (err) {
      console.error("Spin error:", err);
      alert("Connection error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 glass rounded-[2.5rem] w-full max-w-md">
      <div className="text-center">
        <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Daily Plays Left</div>
        <div className={`text-2xl font-bold ${playsLeft !== null && playsLeft <= 2 ? 'text-red-400' : 'text-primary'}`}>
          {playsLeft !== null ? playsLeft : '--'} / 10
        </div>
      </div>

      <div className="relative w-64 h-64">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.15, 0, 0.15, 1] }}
          className="w-full h-full rounded-full border-8 border-white/10 relative overflow-hidden flex items-center justify-center"
        >
          {segments.map((s, i) => (
            <div 
              key={i} 
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 origin-bottom flex items-center justify-center text-xs font-bold ${s.color}`}
              style={{ transform: `rotate(${i * 60}deg) skewY(-30deg)` }}
            >
              <span className="skew-y-[30deg] -translate-y-8">{s.val}</span>
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-4 h-4 bg-white rounded-full shadow-lg border-2 border-background" />
          </div>
        </motion.div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-white rounded-full shadow-lg z-20" />
      </div>

      <div className="text-center">
        {result !== null && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl font-bold mb-4 text-emerald-400">
            {result > 0 ? `You won ${result} TLX!` : "Better luck next time!"}
          </motion.div>
        )}
        <button
          onClick={spin}
          disabled={spinning || (playsLeft !== null && playsLeft <= 0)}
          className="px-12 py-4 gradient-bg rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50"
        >
          {spinning ? 'Spinning...' : (playsLeft !== null && playsLeft <= 0 ? 'Limit Reached' : 'Spin Now')}
        </button>
      </div>
    </div>
  );
};

const MemoryMatch = ({ onWin, onPlay }: { onWin: (amount: number) => void, onPlay: () => Promise<boolean> }) => {
  const [cards, setCards] = useState<{ id: number, val: string, flipped: boolean, matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);

  const init = async () => {
    setLoading(true);
    const success = await onPlay();
    if (!success) {
      setLoading(false);
      return;
    }

    const vals = ['💎', '💰', '🚀', '🔥', '💎', '💰', '🚀', '🔥'];
    const shuffled = [...vals].sort(() => Math.random() - 0.5).map((v, i) => ({ id: i, val: v, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setWon(false);
    setLoading(false);
  };

  useEffect(() => { init(); }, []);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].matched || won || loading) return;
    
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const card1 = cards[newFlipped[0]];
      const card2 = cards[id];
      
      if (card1.val === card2.val) {
        setCards(prev => {
          const updated = prev.map(c => (c.id === newFlipped[0] || c.id === id) ? { ...c, matched: true } : c);
          if (updated.every(c => c.matched)) {
            setWon(true);
            setTimeout(() => onWin(50), 500);
          }
          return updated;
        });
        setFlipped([]);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === newFlipped[0] || c.id === id) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="p-8 glass rounded-[2.5rem] flex flex-col items-center gap-6">
      {cards.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-white/40 mb-4">Start a new game for 10 TLX</p>
          <button onClick={init} disabled={loading} className="px-8 py-3 gradient-bg rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFlip(card.id)}
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all ${
                  card.flipped || card.matched ? 'bg-white/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                {card.flipped || card.matched ? card.val : '?'}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60">Moves: {moves}</span>
            <button onClick={init} disabled={loading} className="text-primary font-bold hover:underline disabled:opacity-50">
              {loading ? 'Wait...' : 'Reset (10 TLX)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const NumberGuess = ({ onWin, onPlay }: { onWin: (amount: number) => void, onPlay: () => Promise<boolean> }) => {
  const [target, setTarget] = useState(Math.floor(Math.random() * 10) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('Guess a number between 1 and 10');
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = () => {
    if (won || loading) return;
    const g = parseInt(guess);
    if (isNaN(g)) return;
    
    if (g === target) {
      setMessage('Correct! You won 20 TLX');
      setWon(true);
      onWin(20);
    } else {
      setMessage(g > target ? 'Too high!' : 'Too low!');
    }
  };

  const reset = async () => {
    setLoading(true);
    const success = await onPlay();
    if (!success) {
      setLoading(false);
      return;
    }
    setTarget(Math.floor(Math.random() * 10) + 1);
    setGuess('');
    setMessage('Guess a number between 1 and 10');
    setWon(false);
    setLoading(false);
  };

  return (
    <div className="p-8 glass rounded-[2.5rem] flex flex-col items-center gap-6">
      <div className="text-xl font-bold">{message}</div>
      {!won ? (
        <>
          <input 
            type="number" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl w-32 focus:outline-none focus:border-primary"
          />
          <button onClick={check} className="px-8 py-3 gradient-bg rounded-xl font-bold">Guess</button>
          <button onClick={reset} disabled={loading} className="text-xs text-white/40 hover:text-white">New Number (10 TLX)</button>
        </>
      ) : (
        <button onClick={reset} disabled={loading} className="px-8 py-3 bg-white/10 rounded-xl font-bold">Play Again (10 TLX)</button>
      )}
    </div>
  );
};

const QuizChallenge = ({ onWin, onPlay }: { onWin: (amount: number) => void, onPlay: () => Promise<boolean> }) => {
  const [qIndex, setQIndex] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  
  const questions = [
    { q: "What is the native token of TeleX?", a: "TLX", o: ["BTC", "TLX", "ETH", "SOL"] },
    { q: "Which animal is often associated with crypto?", a: "Bull", o: ["Bull", "Cat", "Bird", "Fish"] },
    { q: "What does HODL stand for?", a: "Hold On for Dear Life", o: ["Hold On for Dear Life", "Have Only Digital Ledger", "Highly Optimized Data Layer", "None of above"] },
    { q: "Who created Bitcoin?", a: "Satoshi Nakamoto", o: ["Vitalik Buterin", "Elon Musk", "Satoshi Nakamoto", "Mark Zuckerberg"] },
  ];

  const start = async () => {
    setLoading(true);
    const success = await onPlay();
    if (success) {
      setStarted(true);
      setQIndex(0);
      setWon(false);
    }
    setLoading(false);
  };

  const handleAnswer = (ans: string) => {
    if (won) return;
    if (ans === questions[qIndex].a) {
      if (qIndex === questions.length - 1) {
        setWon(true);
        onWin(30);
      } else {
        setQIndex(qIndex + 1);
      }
    } else {
      alert("Wrong! Try again.");
      setQIndex(0);
    }
  };

  return (
    <div className="p-8 glass rounded-[2.5rem] flex flex-col items-center gap-6 max-w-sm w-full">
      {!started ? (
        <div className="text-center">
          <Trophy className="text-primary mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2">Quiz Challenge</h3>
          <p className="text-white/60 mb-6">Answer 4 questions correctly to win 30 TLX</p>
          <button onClick={start} disabled={loading} className="px-8 py-3 gradient-bg rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Starting...' : 'Start Quiz (10 TLX)'}
          </button>
        </div>
      ) : !won ? (
        <>
          <div className="text-center">
            <div className="text-xs text-white/40 mb-2 uppercase tracking-widest">Question {qIndex + 1} of {questions.length}</div>
            <div className="text-xl font-bold">{questions[qIndex].q}</div>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full">
            {questions[qIndex].o.map(opt => (
              <button 
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="p-4 glass rounded-xl hover:bg-white/10 transition-all font-medium text-left"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center">
          <Trophy className="text-yellow-500 mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
          <p className="text-white/60 mb-6">You earned 30 TLX</p>
          <button onClick={start} disabled={loading} className="px-8 py-3 gradient-bg rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Wait...' : 'Play Again (10 TLX)'}
          </button>
        </div>
      )}
    </div>
  );
};

const SnakeGame = ({ onWin }: { onWin: (amount: number) => void }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const GRID_SIZE = 20;
  const CELL_SIZE = 20;

  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState({ x: 0, y: 0 });

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ 
      x: Math.floor(Math.random() * GRID_SIZE), 
      y: Math.floor(Math.random() * GRID_SIZE) 
    });
    setDir({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (dir.y === 0) setDir({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (dir.y === 0) setDir({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (dir.x === 0) setDir({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (dir.x === 0) setDir({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dir]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        handleGameOver();
        return;
      }

      // Self collision
      if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return;
      }

      const newSnake = [newHead, ...snake];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        });
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const handleGameOver = () => {
      setGameOver(true);
      if (score > 0) {
        const reward = Math.floor(score / 2);
        if (reward > 0) onWin(reward);
      }
      if (score > highScore) setHighScore(score);
    };

    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [snake, dir, food, gameStarted, gameOver, score, highScore, onWin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#10b981' : '#059669';
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  }, [snake, food]);

  return (
    <div className="p-8 glass rounded-[2.5rem] flex flex-col items-center gap-6">
      <div className="flex justify-between w-full mb-2">
        <div className="text-sm font-bold text-white/40 uppercase">Score: <span className="text-white">{score}</span></div>
        <div className="text-sm font-bold text-white/40 uppercase">Best: <span className="text-white">{highScore}</span></div>
      </div>

      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={GRID_SIZE * CELL_SIZE} 
          height={GRID_SIZE * CELL_SIZE}
          className="bg-black/20 rounded-xl border border-white/10"
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
            <Gamepad2 className="text-primary mb-4" size={48} />
            <h3 className="text-2xl font-bold mb-4">Snake Classic</h3>
            <button onClick={resetGame} className="px-8 py-3 gradient-bg rounded-xl font-bold">Start Game (10 TLX)</button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
            <h3 className="text-3xl font-bold text-red-500 mb-2">Game Over!</h3>
            <p className="text-white/60 mb-6">You earned {Math.floor(score / 2)} TLX</p>
            <button onClick={resetGame} className="px-8 py-3 gradient-bg rounded-xl font-bold">Try Again (10 TLX)</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button onClick={() => dir.y === 0 && setDir({ x: 0, y: -1 })} className="p-4 glass rounded-xl"><ChevronRight className="-rotate-90" /></button>
        <div />
        <button onClick={() => dir.x === 0 && setDir({ x: -1, y: 0 })} className="p-4 glass rounded-xl"><ChevronRight className="rotate-180" /></button>
        <button onClick={() => dir.y === 0 && setDir({ x: 0, y: 1 })} className="p-4 glass rounded-xl"><ChevronRight className="rotate-90" /></button>
        <button onClick={() => dir.x === 0 && setDir({ x: 1, y: 0 })} className="p-4 glass rounded-xl"><ChevronRight /></button>
      </div>
      
      <p className="text-xs text-white/20 hidden md:block">Use Arrow Keys to Move</p>
    </div>
  );
};

const GamesPage = ({ onWin, onPlay, user }: { onWin: (amount: number) => void, onPlay: () => Promise<boolean>, user: User, key?: string }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    setActiveGame(gameId);
  };

  const games = [
    { id: 'snake', title: 'Snake Classic', icon: Gamepad2, component: SnakeGame, color: 'text-primary' },
    { id: 'spin', title: 'Spin Wheel', icon: Zap, component: SpinWheel, color: 'text-yellow-500' },
    { id: 'memory', title: 'Memory Match', icon: Star, component: MemoryMatch, color: 'text-emerald-500' },
    { id: 'guess', title: 'Number Guess', icon: Flame, component: NumberGuess, color: 'text-orange-500' },
    { id: 'quiz', title: 'Quiz Challenge', icon: Trophy, component: QuizChallenge, color: 'text-primary' },
  ];

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <AdComponent placement="games_top" />
      <div className="mb-12 mt-8">
        <h2 className="text-4xl font-display font-bold mb-2">Mini Games</h2>
        <p className="text-white/60">Play games to multiply your earnings!</p>
      </div>

      {!activeGame ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -5 }}
              onClick={() => handleGameSelect(game.id)}
              className="glass p-8 rounded-[2rem] border-white/5 hover:border-white/20 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <game.icon className={game.color} size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{game.title}</h3>
              <p className="text-sm text-white/40 mb-6">Earn up to 200 TLX</p>
              <div className="w-full py-3 bg-white/5 rounded-xl font-bold group-hover:bg-primary transition-all pointer-events-none">
                Play Now
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setActiveGame(null)}
            className="mb-8 flex items-center gap-2 text-white/60 hover:text-white"
          >
            <ChevronRight className="rotate-180" size={20} />
            Back to Games
          </button>
          <div className="flex justify-center">
            {activeGame === 'snake' && <SnakeGame onWin={onWin} />}
            {activeGame === 'spin' && <SpinWheel onWin={onWin} onPlay={onPlay} userId={user.id} />}
            {activeGame === 'memory' && <MemoryMatch onWin={onWin} onPlay={onPlay} />}
            {activeGame === 'guess' && <NumberGuess onWin={onWin} onPlay={onPlay} />}
            {activeGame === 'quiz' && <QuizChallenge onWin={onWin} onPlay={onPlay} />}
          </div>
        </div>
      )}
      <AdComponent placement="games_bottom" />
    </div>
  );
};

const DailyBonusPage = ({ userId, onClaim }: { userId: string, onClaim: () => Promise<boolean>, key?: string }) => {
  const [claimed, setClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const days = [10, 20, 30, 40, 50, 75, 100];

  useEffect(() => {
    if (userId) {
      fetch(`/api/daily/status?userId=${userId}`)
        .then(r => r.json())
        .then(data => {
          setClaimed(data.claimed);
          setStreak(data.streak);
        });
    }
  }, [userId]);

  const handleClaimClick = async () => {
    setIsClaiming(true);
    const success = await onClaim();
    if (success) {
      setClaimed(true);
      setStreak(prev => prev + 1);
    }
    setIsClaiming(false);
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <AdComponent placement="daily_top" />
      <div className="text-center mb-12 mt-8">
        <h2 className="text-4xl font-display font-bold mb-2">Daily Bonus</h2>
        <p className="text-white/60">Claim your free coins every 24 hours.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border-white/10">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-10">
          {days.map((reward, i) => {
            const isCurrent = i === (streak % 7);
            const isCompleted = i < (streak % 7);
            return (
              <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                isCurrent ? 'bg-primary/20 border-primary scale-110 shadow-lg shadow-primary/10' : 
                isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 
                'bg-white/5 border-white/5'
              }`}>
                <div className="text-[10px] uppercase font-bold text-white/40">Day {i + 1}</div>
                <Coins size={20} className={isCurrent ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-white/20'} />
                <div className="font-bold text-sm">{reward}</div>
              </div>
            );
          })}
        </div>

        <button
          disabled={claimed || isClaiming}
          onClick={handleClaimClick}
          className="w-full py-5 gradient-bg rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
        >
          {isClaiming ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Claiming...
            </>
          ) : claimed ? (
            'Claimed Today'
          ) : (
            'Claim Daily Reward'
          )}
        </button>
        <p className="text-center text-xs text-white/40 mt-6">
          {claimed ? 'Come back tomorrow for your next reward!' : 'Claim your reward now to keep your streak!'}
        </p>
      </div>
      <AdComponent placement="daily_bottom" />
    </div>
  );
};

const CouponsPage = ({ onRedeem }: { onRedeem: (code: string) => void, key?: string }) => {
  const [code, setCode] = useState('');

  return (
    <div className="pt-24 pb-12 px-4 max-w-xl mx-auto">
      <AdComponent placement="coupons_top" />
      <div className="text-center mb-12 mt-8">
        <h2 className="text-4xl font-display font-bold mb-2">Redeem Coupon</h2>
        <p className="text-white/60">Enter a code to receive special rewards.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border-white/10">
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Coupon Code</label>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ENTER CODE HERE"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button 
          onClick={() => onRedeem(code)}
          className="w-full py-4 gradient-bg rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
        >
          Redeem Now
        </button>
      </div>
      <AdComponent placement="coupons_bottom" />
    </div>
  );
};

const WithdrawPage = ({ coins, settings }: { coins: number, settings: AppSettings, key?: string }) => {
  const [method, setMethod] = useState('paypal');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  if (settings.withdrawals_enabled !== 'true') {
    return (
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto text-center">
        <div className="glass p-12 rounded-[2.5rem] border-white/10">
          <AlertCircle size={64} className="text-warning mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Withdrawals Paused</h2>
          <p className="text-white/60">Withdrawals are temporarily disabled for maintenance. Please keep earning and check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <AdComponent placement="withdraw_top" />
      <div className="mb-12 mt-8">
        <h2 className="text-4xl font-display font-bold mb-2">Withdraw Earnings</h2>
        <p className="text-white/60">Convert your TLX coins into real money.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border-white/10">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-6 rounded-2xl">
            <div className="text-xs text-white/40 uppercase font-bold mb-1">Your Balance</div>
            <div className="text-2xl font-bold">{coins.toLocaleString()} TLX</div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="text-xs text-white/40 uppercase font-bold mb-1">Min. Withdrawal</div>
            <div className="text-2xl font-bold">{settings.min_withdrawal} TLX</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Select Method</label>
            <div className="grid grid-cols-2 gap-3">
              {['paypal', 'bitcoin', 'ethereum', 'giftcard'].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-4 rounded-xl border font-bold capitalize transition-all ${
                    method === m ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Withdrawal Address / Email</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your details"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Amount (TLX)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>

          <button className="w-full py-4 gradient-bg rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
            Submit Withdrawal
          </button>
        </div>
      </div>
      <AdComponent placement="withdraw_bottom" />
    </div>
  );
};

// --- Admin Panel ---

const AdminPanel = ({ onClose, onTasksChange }: { onClose: () => void, onTasksChange?: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [ads, setAds] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', reward: 0, usage_limit: 100, expiry_date: '2026-12-31' });

  const fetchData = async () => {
    const ts = Date.now();
    try {
      const [u, t, c, w, s, a] = await Promise.all([
        fetch(`/api/admin/users?t=${ts}`).then(r => r.json()),
        fetch(`/api/admin/tasks?t=${ts}`).then(r => r.json()),
        fetch(`/api/admin/coupons?t=${ts}`).then(r => r.json()),
        fetch(`/api/admin/withdrawals?t=${ts}`).then(r => r.json()),
        fetch(`/api/settings?t=${ts}`).then(r => r.json()),
        fetch(`/api/admin/ads?t=${ts}`).then(r => r.json())
      ]);
      setUsers(u);
      setTasks(t);
      console.log('[ADMIN] Tasks refreshed:', t);
      setCoupons(c);
      setWithdrawals(w);
      setSettings(s);
      setAds(a);
      if (onTasksChange) onTasksChange();
    } catch (err) {
      console.error('[ADMIN] Error fetching data:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser)
    });
    setEditingUser(null);
    fetchData();
  };

  const handleSaveTask = async () => {
    const method = editingTask.id ? 'PUT' : 'POST';
    const url = editingTask.id ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTask)
    });
    setEditingTask(null);
    fetchData();
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = Number(id);
    console.log('[ADMIN] >>> DELETE REQUESTED for ID:', taskId);
    
    if (!window.confirm(`Are you absolutely sure you want to delete task #${taskId}? This cannot be undone.`)) {
      return;
    }
    
    try {
      // 1. Optimistic UI update
      setTasks(prev => prev.filter(t => Number(t.id) !== taskId));
      
      // 2. Server request
      const res = await fetch(`/api/admin/tasks/delete?t=${Date.now()}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId })
      });
      
      const data = await res.json();
      console.log('[ADMIN] Server Response:', data);
      
      if (data.success) {
        console.log('[ADMIN] Deletion confirmed by server');
        // 3. Refresh all data to stay in sync
        await fetchData();
      } else {
        console.error('[ADMIN] Deletion failed on server:', data.message);
        alert(`Error: ${data.message}`);
        // Rollback on failure
        await fetchData();
      }
    } catch (err) {
      console.error('[ADMIN] Network Error:', err);
      alert('Network error. Please try again.');
      await fetchData();
    }
  };

  const handleCreateCoupon = async () => {
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon)
    });
    setNewCoupon({ code: '', reward: 0, usage_limit: 100, expiry_date: '2026-12-31' });
    fetchData();
  };

  const handleUpdateWithdrawal = async (id: number, status: string) => {
    await fetch('/api/admin/withdrawals/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    fetchData();
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    const count = selectedTasks.length;
    if (!confirm(`Permanently delete ${count} selected tasks?`)) return;

    const taskIdsToDelete = selectedTasks.map(id => Number(id));
    console.log('[ADMIN] Attempting bulk delete for:', taskIdsToDelete);

    try {
      const res = await fetch(`/api/admin/tasks/bulk-delete?t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ ids: taskIdsToDelete })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        console.log('[ADMIN] Bulk delete successful:', data);
        setTasks(prev => prev.filter(t => !taskIdsToDelete.includes(Number(t.id))));
        setSelectedTasks([]);
        alert(`Successfully deleted ${count} tasks`);
        await fetchData();
      } else {
        console.error('[ADMIN] Bulk delete failed:', data);
        alert(`Bulk delete failed: ${data.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('[ADMIN] Network error:', err);
      alert('Network error during bulk delete');
    }
  };

  const handleSaveAd = async (placement: string, code: string, active: boolean) => {
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placement, code, active })
    });
    fetchData();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Lock },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[110] bg-background flex flex-col md:flex-row"
    >
      {/* Mobile Admin Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background">
        <div className="text-xl font-bold flex items-center gap-2">
          <Lock size={20} className="text-primary" />
          TeleX Admin
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 glass rounded-lg">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 border-r border-white/5 p-6 flex-col gap-2 bg-background absolute md:relative inset-0 top-[65px] md:top-0 z-20`}>
        <div className="hidden md:flex text-xl font-bold mb-8 items-center gap-2">
          <Lock size={20} className="text-primary" />
          TeleX Admin
        </div>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id ? 'bg-primary text-white' : 'text-white/40 hover:bg-white/5'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
        <button 
          onClick={onClose}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
        >
          <X size={18} />
          Exit Admin
        </button>
      </div>

      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">Analytics Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass p-8 rounded-3xl">
                    <div className="text-white/40 mb-2">Total Users</div>
                    <div className="text-4xl font-bold">{users.length}</div>
                  </div>
                  <div className="glass p-8 rounded-3xl">
                    <div className="text-white/40 mb-2">Active Tasks</div>
                    <div className="text-4xl font-bold">{tasks.length}</div>
                  </div>
                  <div className="glass p-8 rounded-3xl">
                    <div className="text-white/40 mb-2">Pending Withdrawals</div>
                    <div className="text-4xl font-bold">{withdrawals.filter(w => w.status === 'pending').length}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">User Management</h2>
                <div className="glass rounded-3xl overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Balance</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="p-4">
                            <div className="font-bold">{u.username}</div>
                            <div className="text-xs text-white/40">{u.id}</div>
                          </td>
                          <td className="p-4 font-mono">{u.coins} TLX</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_blocked ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                              {u.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button onClick={() => setEditingUser(u)} className="text-primary text-sm font-bold hover:underline">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold">Task Management</h2>
                    <button 
                      onClick={fetchData}
                      className="p-2 glass rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Refresh Data"
                    >
                      <TrendingUp size={18} className="rotate-90" />
                    </button>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="select-all"
                        checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(tasks.map(t => t.id));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                      />
                      <label htmlFor="select-all" className="text-xs font-bold text-white/40 uppercase cursor-pointer">All</label>
                    </div>
                    {selectedTasks.length > 0 && (
                      <button 
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X size={14} />
                        Delete {selectedTasks.length}
                      </button>
                    )}
                  </div>
                  <button onClick={() => setEditingTask({ title: '', reward: 0, time_estimate: '5 min', category: 'Survey', icon: 'Zap', active: 1, link: '', expires_at: null })} className="px-6 py-2 gradient-bg rounded-xl font-bold w-full sm:w-auto">Add Task</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {tasks.map(t => (
                      <motion.div 
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`glass p-6 rounded-3xl flex justify-between items-center border-2 transition-all ${selectedTasks.includes(t.id) ? 'border-primary bg-primary/5' : 'border-transparent'}`}
                      >
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox" 
                            checked={selectedTasks.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTasks(prev => [...prev, t.id]);
                              } else {
                                setSelectedTasks(prev => prev.filter(id => id !== t.id));
                              }
                            }}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                          />
                          <div>
                            <div className="font-bold text-lg md:text-xl">{t.title}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-primary font-bold">{t.reward} TLX</div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {t.active ? 'Active' : 'Inactive'}
                              </span>
                              {t.expires_at && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[10px] font-bold uppercase flex items-center gap-1">
                                  <TrendingUp size={10} />
                                  Expires: {new Date(t.expires_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingTask(t)} className="p-2 glass rounded-lg text-primary hover:bg-primary/10 transition-colors"><ClipboardList size={18} /></button>
                          <button onClick={(e) => handleDeleteTask(e, t.id)} className="p-2 glass rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"><X size={18} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">Coupons</h2>
                <div className="glass p-6 md:p-8 rounded-3xl mb-8">
                  <h3 className="text-xl font-bold mb-4">Create New Coupon</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input placeholder="Code" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                    <input placeholder="Reward" type="number" value={newCoupon.reward || 0} onChange={e => setNewCoupon({...newCoupon, reward: parseInt(e.target.value) || 0})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                    <input placeholder="Limit" type="number" value={newCoupon.usage_limit || 0} onChange={e => setNewCoupon({...newCoupon, usage_limit: parseInt(e.target.value) || 0})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                    <button onClick={handleCreateCoupon} className="gradient-bg rounded-xl font-bold py-2">Create</button>
                  </div>
                </div>
                <div className="glass rounded-3xl overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="p-4">Code</th>
                        <th className="p-4">Reward</th>
                        <th className="p-4">Used</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {coupons.map(c => (
                        <tr key={c.code}>
                          <td className="p-4 font-mono">{c.code}</td>
                          <td className="p-4">{c.reward} TLX</td>
                          <td className="p-4">{c.used_count} / {c.usage_limit}</td>
                          <td className="p-4">
                            <button onClick={() => fetch(`/api/admin/coupons/${c.code}`, { method: 'DELETE' }).then(fetchData)} className="text-red-400">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">Withdrawal Requests</h2>
                <div className="glass rounded-3xl overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {withdrawals.map(w => (
                        <tr key={w.id}>
                          <td className="p-4">
                            <div className="font-bold">{w.username}</div>
                            <div className="text-xs text-white/40">{w.address}</div>
                          </td>
                          <td className="p-4 font-mono">{w.amount} TLX</td>
                          <td className="p-4 capitalize">{w.method}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${w.status === 'pending' ? 'bg-warning/20 text-warning' : w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                            {w.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateWithdrawal(w.id, 'completed')} className="text-emerald-500 text-sm font-bold">Approve</button>
                                <button onClick={() => handleUpdateWithdrawal(w.id, 'rejected')} className="text-red-500 text-sm font-bold">Reject</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">Ad Management</h2>
                
                {/* Custom Head Code Section */}
                <div className="glass p-8 rounded-3xl mb-12 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="text-primary" size={24} />
                    <h3 className="text-2xl font-bold tracking-tight">Direct Head Injection</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-6 max-w-2xl">
                    Paste any code here (e.g., Monetag Global Tag, Google Analytics, Meta tags) to have it injected directly between the <code className="text-primary">&lt;head&gt;</code> tags of your website.
                  </p>
                  <textarea 
                    placeholder="Paste your code here..."
                    value={settings.head_custom_code || ''}
                    onChange={(e) => setSettings({...settings, head_custom_code: e.target.value})}
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-xs focus:outline-none focus:border-primary mb-6 shadow-inner"
                  />
                  <button 
                    onClick={() => handleUpdateSetting('head_custom_code', settings.head_custom_code)}
                    className="px-10 py-4 bg-primary rounded-2xl font-bold hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center gap-2"
                  >
                    <Save size={20} />
                    Save & Inject to Head
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[
                    { id: 'top', label: 'Global Top Banner' },
                    { id: 'bottom', label: 'Global Bottom Banner' },
                    { id: 'home_middle', label: 'Home Page (Middle)' },
                    { id: 'tasks_sidebar', label: 'Tasks Page (Sidebar)' },
                    { id: 'tasks_bottom', label: 'Tasks Page (Bottom)' },
                    { id: 'games_top', label: 'Games Page (Top)' },
                    { id: 'games_bottom', label: 'Games Page (Bottom)' },
                    { id: 'daily_top', label: 'Daily Bonus (Top)' },
                    { id: 'daily_bottom', label: 'Daily Bonus (Bottom)' },
                    { id: 'coupons_top', label: 'Coupons (Top)' },
                    { id: 'coupons_bottom', label: 'Coupons (Bottom)' },
                    { id: 'withdraw_top', label: 'Withdraw (Top)' },
                    { id: 'withdraw_bottom', label: 'Withdraw (Bottom)' },
                  ].map(placement => {
                    const ad = ads.find(a => a.placement === placement.id) || { code: '', active: 0 };
                    return (
                      <div key={placement.id} className="glass p-8 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">{placement.label}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40 uppercase font-bold">Active</span>
                            <input 
                              type="checkbox" 
                              checked={ad.active === 1}
                              onChange={(e) => handleSaveAd(placement.id, ad.code, e.target.checked)}
                              className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                          </div>
                        </div>
                        <textarea 
                          placeholder="Paste ad code here (e.g., Monetag tag)"
                          value={ad.code}
                          onChange={(e) => {
                            const newAds = [...ads];
                            const idx = newAds.findIndex(a => a.placement === placement.id);
                            if (idx >= 0) newAds[idx].code = e.target.value;
                            else newAds.push({ placement: placement.id, code: e.target.value, active: 0 });
                            setAds(newAds);
                          }}
                          className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-xs focus:outline-none focus:border-primary mb-4"
                        />
                        <button 
                          onClick={() => handleSaveAd(placement.id, ad.code, ad.active === 1)}
                          className="w-full py-3 bg-primary rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
                        >
                          Save Ad Code
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8">Global Settings</h2>
                <div className="space-y-6 max-w-md">
                  <div className="glass p-6 rounded-3xl flex justify-between items-center">
                    <div>
                      <div className="font-bold">Withdrawals Enabled</div>
                      <div className="text-sm text-white/40">Allow users to request payouts</div>
                    </div>
                    <button 
                      onClick={() => handleUpdateSetting('withdrawals_enabled', settings.withdrawals_enabled === 'true' ? 'false' : 'true')}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.withdrawals_enabled === 'true' ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.withdrawals_enabled === 'true' ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="glass p-6 rounded-3xl">
                    <div className="font-bold mb-4">Minimum Withdrawal (TLX)</div>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        value={settings.min_withdrawal} 
                        onChange={e => setSettings({...settings, min_withdrawal: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex-1"
                      />
                      <button onClick={() => handleUpdateSetting('min_withdrawal', settings.min_withdrawal)} className="px-6 py-2 gradient-bg rounded-xl font-bold">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border-white/10">
              <h3 className="text-2xl font-bold mb-6">Edit User: {editingUser.username}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">Coins</label>
                  <input type="number" value={editingUser.coins || 0} onChange={e => setEditingUser({...editingUser, coins: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">Total Earned</label>
                  <input type="number" value={editingUser.total_earned || 0} onChange={e => setEditingUser({...editingUser, total_earned: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Blocked</span>
                  <button 
                    onClick={() => setEditingUser({...editingUser, is_blocked: !editingUser.is_blocked})}
                    className={`w-12 h-6 rounded-full transition-all relative ${editingUser.is_blocked ? 'bg-red-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingUser.is_blocked ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {editingUser.is_blocked && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/40 mb-2">Reason</label>
                    <input value={editingUser.block_reason || ''} onChange={e => setEditingUser({...editingUser, block_reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setEditingUser(null)} className="flex-1 py-3 glass rounded-xl font-bold">Cancel</button>
                  <button onClick={handleUpdateUser} className="flex-1 py-3 gradient-bg rounded-xl font-bold">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border-white/10">
              <h3 className="text-2xl font-bold mb-6">{editingTask.id ? 'Edit Task' : 'Add Task'}</h3>
              <div className="space-y-4">
                <input placeholder="Title" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                <input placeholder="Reward" type="number" value={editingTask.reward || 0} onChange={e => setEditingTask({...editingTask, reward: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                <input placeholder="Time Estimate" value={editingTask.time_estimate} onChange={e => setEditingTask({...editingTask, time_estimate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                <input placeholder="Category" value={editingTask.category} onChange={e => setEditingTask({...editingTask, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                <input placeholder="Task Link (URL)" value={editingTask.link} onChange={e => setEditingTask({...editingTask, link: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase px-1">Expiration (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={editingTask.expires_at ? (() => {
                      const d = new Date(editingTask.expires_at);
                      const offset = d.getTimezoneOffset() * 60000;
                      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
                    })() : ''} 
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) {
                        setEditingTask({...editingTask, expires_at: null});
                        return;
                      }
                      // datetime-local gives YYYY-MM-DDTHH:mm in local time
                      // new Date() will parse it as local time, then toISOString() converts to UTC
                      setEditingTask({...editingTask, expires_at: new Date(val).toISOString()});
                    }} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Active</span>
                  <button 
                    onClick={() => setEditingTask({...editingTask, active: editingTask.active === 1 ? 0 : 1})}
                    className={`w-12 h-6 rounded-full transition-all relative ${editingTask.active === 1 ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingTask.active === 1 ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setEditingTask(null)} className="flex-1 py-3 glass rounded-xl font-bold">Cancel</button>
                  <button onClick={handleSaveTask} className="flex-1 py-3 gradient-bg rounded-xl font-bold">Save Task</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ withdrawals_enabled: 'true', min_withdrawal: '1000' });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const refreshData = async () => {
    const userId = localStorage.getItem('telex_user_id');
    if (!userId) return;

    try {
      const [userData, settingsData, tasksData] = await Promise.all([
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch(`/api/tasks?userId=${userId}`).then(r => r.json())
      ]);
      
      setUser(userData);
      setSettings(settingsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const [initError, setInitError] = useState<string | null>(null);
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    let userId = localStorage.getItem('telex_user_id');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('telex_user_id', userId);
    }

    const init = async (retries = 3) => {
      console.log(`Initializing TeleX... Attempt ${4 - retries}`);
      try {
        const [userRes, settingsRes] = await Promise.all([
          fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          }),
          fetch('/api/settings')
        ]);

        if (!userRes.ok || !settingsRes.ok) {
          throw new Error(`API Error: User(${userRes.status}) Settings(${settingsRes.status})`);
        }

        const userData = await userRes.json();
        const settingsData = await settingsRes.json();

        if (userData && userData.id) {
          console.log('Profile loaded successfully');
          setUser(userData);
          setSettings(settingsData);
          setInitError(null);
          setIsInitialLoading(false); 
        } else {
          throw new Error('Invalid data format from server');
        }
      } catch (err: any) {
        console.error('Init error:', err);
        if (retries > 0) {
          console.log(`Retrying in 2s... (${retries} left)`);
          setTimeout(() => init(retries - 1), 2000);
        } else {
          setInitError(err.message || String(err));
          setIsInitialLoading(false);
        }
      }
    };

    init();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('telex_user_id');
    if (activeTab === 'tasks' && userId) {
      fetch(`/api/tasks?userId=${userId}`).then(r => r.json()).then(setTasks);
    }
  }, [activeTab]);

  const handleEarn = async (amount: number, reason: string, taskId?: number): Promise<boolean> => {
    if (!user) return false;
    
    const url = taskId ? '/api/tasks/complete' : '/api/user/add-coins';
    const body = taskId ? { userId: user.id, taskId } : { userId: user.id, amount, reason };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const reward = taskId ? data.reward : amount;
        setUser(prev => prev ? { 
          ...prev, 
          coins: prev.coins + reward, 
          total_earned: prev.total_earned + Math.max(0, reward) 
        } : null);
        
        if (taskId) {
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: 1 } : t));
        }
        return true;
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to process reward');
        return false;
      }
    } catch (err) {
      console.error("Earn error:", err);
      alert("Connection error. Please try again.");
      return false;
    }
  };

  const handleAdminLogin = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminCreds)
    });
    if (res.ok) {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert('Invalid admin credentials');
    }
  };

  const handleDailyClaim = async () => {
    if (!user) return false;
    try {
      const res = await fetch('/api/daily/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { 
          ...prev, 
          coins: prev.coins + data.reward, 
          total_earned: prev.total_earned + data.reward 
        } : null);
        alert(`Success! You claimed ${data.reward} TLX. Streak: ${data.streak} days!`);
        return true;
      } else {
        if (data.message === "Already claimed today") {
          alert("Reward already received! Come back tomorrow.");
        } else {
          alert(data.message || 'Failed to claim');
        }
        return false;
      }
    } catch (err) {
      console.error('Daily claim error:', err);
      alert('Failed to connect to server');
      return false;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('disable_head_code') === 'true') {
      console.log('Custom head code injection disabled via query parameter.');
      return;
    }

    if (settings.head_custom_code) {
      console.log('Injecting custom head code...');
      // Remove any previously injected custom head code to avoid duplicates
      const existing = document.querySelectorAll('[data-custom-head]');
      existing.forEach(el => el.remove());

      // Parse and inject new code
      const range = document.createRange();
      const fragment = range.createContextualFragment(settings.head_custom_code);
      
      // Mark elements so we can find them later
      fragment.querySelectorAll('*').forEach(el => el.setAttribute('data-custom-head', 'true'));
      
      document.head.appendChild(fragment);
    }

    return () => {
      document.querySelectorAll('[data-custom-head]').forEach(el => el.remove());
    };
  }, [settings.head_custom_code]);

  if (isInitialLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 gradient-bg rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse">
            <Zap className="text-white fill-white" size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">TeleX</h1>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-white/40 font-mono text-sm">
                <RefreshCw size={14} className="animate-spin" />
                <span>{isInitialLoading ? 'Loading your profile...' : 'Failed to load profile'}</span>
              </div>
              {initError && (
                <div className="max-w-xs w-full mt-4">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2 text-red-400">
                      <Zap size={18} />
                      <span className="font-bold text-sm uppercase tracking-wider">System Error</span>
                    </div>
                    <p className="text-white/80 text-xs font-mono break-all leading-relaxed">
                      {initError}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Troubleshooting</p>
                      <ul className="text-[10px] text-white/60 list-disc list-inside space-y-1">
                        <li>Check Vercel Environment Variables</li>
                        <li>Verify GEMINI_API_KEY is set</li>
                        <li>Ensure Database is initialized</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {!isInitialLoading && !user && (
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar 
        coins={user?.coins || 0} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        withdrawalsEnabled={settings.withdrawals_enabled === 'true'}
        onRefresh={refreshData}
      />

      <main>
        <AdComponent placement="top" />
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomePage key="home" onStart={setActiveTab} onRefresh={refreshData} />}
          {activeTab === 'tasks' && user && <TasksPage key="tasks" tasks={tasks as any} onComplete={(t) => handleEarn(t.reward, `Task: ${t.title}`, t.id)} onRefresh={refreshData} />}
          {activeTab === 'games' && user && <GamesPage key="games" user={user} 
            onPlay={() => handleEarn(-10, 'Game Entry')}
            onWin={(amt) => handleEarn(amt, 'Game Win')} 
          />}
          {activeTab === 'daily' && user && <DailyBonusPage key="daily" userId={user.id} onClaim={handleDailyClaim} />}
          {activeTab === 'coupons' && user && <CouponsPage key="coupons" onRedeem={(code) => {
            fetch('/api/coupons/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, userId: user.id })
            }).then(r => r.json()).then(data => {
              if (data.success) {
                handleEarn(data.reward, `Coupon: ${code}`);
                alert(`Success! You got ${data.reward} TLX`);
              } else {
                if (data.message === "You have already redeemed this coupon") {
                  alert("Reward already received! This coupon can only be used once.");
                } else {
                  alert(data.message || 'Invalid code');
                }
              }
            });
          }} />}
          {activeTab === 'withdraw' && user && <WithdrawPage key="withdraw" coins={user.coins} settings={settings} />}
        </AnimatePresence>
        <AdComponent placement="bottom" />
      </main>

      {/* Admin Button - Hidden from normal users */}
      <button 
        onClick={() => setShowAdminLogin(true)}
        className="fixed bottom-0 right-0 z-[100] w-4 h-4 bg-transparent cursor-default"
      />

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-8 rounded-[2rem] w-full max-w-md border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Admin Login</h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-white/40 hover:text-white"><X /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={adminCreds.email}
                    onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">Password</label>
                  <input 
                    type="password" 
                    value={adminCreds.password}
                    onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                  />
                </div>
                <button 
                  onClick={handleAdminLogin}
                  className="w-full py-4 gradient-bg rounded-xl font-bold text-lg mt-4"
                >
                  Login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Overlay */}
      {isAdmin && <AdminPanel 
        onClose={() => {
          setIsAdmin(false);
          // Refresh main app data when admin panel closes
          const userId = localStorage.getItem('telex_user_id');
          if (userId) {
            fetch(`/api/tasks?userId=${userId}`).then(r => r.json()).then(setTasks);
            fetch('/api/settings').then(r => r.json()).then(setSettings);
            fetch('/api/user/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            }).then(r => r.json()).then(setUser);
          }
        }}
        onTasksChange={() => {
          const userId = localStorage.getItem('telex_user_id');
          if (userId) {
            fetch(`/api/tasks?userId=${userId}`).then(r => r.json()).then(setTasks);
          }
        }}
      />}

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
