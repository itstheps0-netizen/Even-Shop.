/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy, where, addDoc, serverTimestamp, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Flame, Diamond, Shield, ShoppingCart, LogOut, Settings, Plus, History, CheckCircle2, Clock, XCircle, Bot, Zap, Smartphone, CreditCard, Search, UserCircle, Home as HomeIcon, Trash2, Edit, Gift, Trophy, RefreshCw, Star, Users, DollarSign, LayoutDashboard, Filter, ChevronRight, Sparkles, Bell, Link as LinkIcon, Image as ImageIcon, Video } from 'lucide-react';

const LOGO_URL = "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/flame.svg"; // Fallback URL, but we will use the component

const Logo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <motion.div 
      animate={{ scale: [1, 1.2, 1] }} 
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute inset-0 bg-orange-600/20 blur-md rounded-full" 
    />
    <Flame className="w-full h-full text-orange-600 relative z-10 fill-orange-600/20" strokeWidth={2.5} />
  </div>
);

// --- Notification UI Component ---
const NotificationPrompt = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [isOpen, setIsOpen] = useState(permission === 'default');

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    setIsOpen(false);
    if (res === 'granted') {
      new Notification("Notifications Enabled!", {
        body: "You will now receive updates on your orders and messages.",
        icon: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/flame.svg"
      });
    }
  };

  if (permission === 'granted' || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full"
      >
        <Card className="bg-zinc-900 border-zinc-800 border-t-4 border-t-orange-600 shadow-2xl shadow-orange-600/20 overflow-hidden">
          <CardContent className="p-8 flex flex-col gap-6 text-center">
            <div className="mx-auto h-16 w-16 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-600">
              <Bell className="h-8 w-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Stay Connected</h4>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">Enable push notifications to receive real-time updates on your orders and direct messages from the admin team.</p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={requestPermission} className="w-full bg-orange-600 text-black font-black uppercase tracking-widest h-12 rounded-xl text-xs hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all active:scale-95">
                Enable Notifications
              </Button>
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest hover:text-white">
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// --- Professional Loader ---
const ProfessionalLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Exactly 1.5 seconds (1500ms). Increment every 50ms (0.05s).
    // 1500 / 50 = 30 increments total.
    // 100 / 30 = 3.333% progress per increment.
    const interval = 50;
    const duration = 1500;
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small buffer at 100%
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent opacity-50" />
      
      <div className="relative w-40 h-40 mb-16">
        <motion.div 
           animate={{ 
             scale: [0.8, 1.1, 0.8], 
             opacity: [0.3, 0.6, 0.3],
             rotate: [0, 180, 360]
           }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 bg-orange-600/10 blur-[100px] rounded-full"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="relative z-10 w-full h-full"
        >
          <Logo className="w-full h-full" />
        </motion.div>
      </div>

      <div className="w-full max-w-[280px] space-y-6 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none"
            >
              EVEN <span className="text-orange-600">SHOP</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-0.5"
            >
              Elite Digital Ecosystem
            </motion.p>
          </div>
          <p className="text-orange-600 font-mono text-[10px] font-bold mb-1 tracking-tighter">{Math.floor(progress)}%</p>
        </div>
        
        <div className="h-[2px] w-full bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
            className="h-full bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.5)]"
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="h-2.5 w-2.5 text-zinc-800 animate-spin" />
          <span className="text-[7px] font-bold text-zinc-800 uppercase tracking-[0.5em]">Establishing Secure Neural Link</span>
        </motion.div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <Shield className="h-4 w-4 text-zinc-900" />
          <Zap className="h-4 w-4 text-zinc-900" />
          <Flame className="h-4 w-4 text-zinc-900" />
        </div>
        <p className="text-[8px] font-black text-zinc-900 uppercase tracking-[0.8em] mt-2">Authenticated Connection</p>
      </div>
    </motion.div>
  );
};

// --- Support Components ---

const UserSupport = ({ user }: { user: User | null }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'support'), where('userId', '==', user.uid), orderBy('createdAt', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Support messages snapshot error:", error);
      });
      return () => unsub();
    }
  }, [user]);

  const sendSupportMessage = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'support'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        text: message.trim(),
        type: 'user',
        createdAt: serverTimestamp()
      });
      setMessage('');
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <h2 className="text-4xl font-black uppercase text-white mb-8 tracking-tighter italic">Help <span className="text-orange-600">& Support</span></h2>
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 flex flex-col">
            {messages.length === 0 && <p className="text-zinc-600 text-center my-auto italic">No messages yet. Send a message to start a conversation with the admin.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${m.type === 'admin' ? 'bg-zinc-800 text-white' : 'bg-orange-600 text-black font-medium'}`}>
                  <p className="text-sm">{m.text}</p>
                  <p className="text-[8px] mt-1 opacity-50 font-black uppercase">{m.createdAt?.toDate().toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/20 flex gap-4">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="bg-black border-zinc-800"
              onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
            />
            <Button onClick={sendSupportMessage} disabled={sending} className="bg-orange-600 text-black font-black">SEND</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LegalPage = ({ type }: { type: 'privacy' | 'terms' }) => (
  <div className="container mx-auto px-4 py-24 min-h-screen max-w-4xl">
    <h1 className="text-5xl font-black uppercase text-white mb-12 tracking-tighter">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
    <div className="prose prose-invert prose-orange max-w-none space-y-8 text-zinc-400">
      <section>
        <h2 className="text-2xl font-bold text-white uppercase italic">1. Introduction</h2>
        <p>Welcome to EVEN SHOP. By using our platform, you agree to comply with and be bound by the following {type === 'privacy' ? 'privacy practices' : 'terms and conditions'}.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white uppercase italic">2. Digital Products</h2>
        <p>All items sold on EVEN SHOP are digital products. Once an order is processed and delivered (e.g., diamonds added to your account), it is non-refundable. Please ensure your Game ID is correct before ordering.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white uppercase italic">3. User Conduct</h2>
        <p>Any attempt to abuse our referral system or engage in fraudulent activities (e.g., fake transaction IDs) will result in an immediate and permanent ban of your account without notice.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-white uppercase italic">4. Data Security</h2>
        <p>We take your data security seriously. We only store necessary information to process your orders and provide support. We never share your personal information with third parties.</p>
      </section>
      <p className="text-sm font-black pt-12 border-t border-zinc-800">Last updated: April 19, 2026</p>
    </div>
  </div>
);

// --- Referral Logic ---
const generateReferralCode = (uid: string) => uid.slice(0, 6).toUpperCase();

const LuckyWheel = ({ referralCount, user }: { referralCount: number, user: User | null }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    if (user) {
        getDocs(query(collection(db, 'users'), where('uid', '==', user.uid))).then(sn => {
          if (!sn.empty) setHasSpun(!!sn.docs[0].data().hasSpun);
       });
    }
  }, [user]);

  const spin = () => {
    if (referralCount < 10) {
      toast.error('You need at least 10 referrals to spin!');
      return;
    }
    if (hasSpun) {
      toast.error('You have already used your spin!');
      return;
    }
    setSpinning(true);
    setResult(null);
    
    // Wheel logic: Determine prize
    const rand = Math.random() * 100;
    let selectedPrize = 'Nothing';
    let tokenAmount = 0;
    let targetSegmentIndex = 3; // Index mapping to nothing

    // 0.01% chance hit! (Kept for token logic, but removed UI mention)
    if (rand <= 0.01) {
      const tokenRand = Math.random();
      if (tokenRand < 0.33) { selectedPrize = '5 Tokens'; tokenAmount = 5; targetSegmentIndex = 0; }
      else if (tokenRand < 0.66) { selectedPrize = '10 Tokens'; tokenAmount = 10; targetSegmentIndex = 1; }
      else { selectedPrize = '15 Tokens'; tokenAmount = 15; targetSegmentIndex = 2; }
    }

    // Wheel logic: 4 segments = 90deg per segment.
    // Segment Centers: 0: 45deg, 1: 135deg, 2: 225deg, 3: 315deg
    const segmentAngle = 360 / 4;
    const targetAngle = 360 - (targetSegmentIndex * segmentAngle + (segmentAngle / 2));
    const newRotation = rotation + (360 * 5) + targetAngle - (rotation % 360);

    setRotation(newRotation);
    
    setTimeout(async () => {
      setSpinning(false);
      setResult(selectedPrize);
      setHasSpun(true);
      
      if (user) {
        try {
          const userDocSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
          if (!userDocSnap.empty) {
            const currentTokens = userDocSnap.docs[0].data().tokens || 0;
            // deduct 10 referrals, set hasSpun to true, and add prizes if won
            await updateDoc(doc(db, 'users', user.uid), {
                referralCount: (referralCount - 10),
                hasSpun: true,
                tokens: currentTokens + tokenAmount
            });
            if (tokenAmount > 0) {
               toast.success(`CONGRATS! YOU WON ${selectedPrize}!`);
            } else {
               toast.success(`BETTER LUCK NEXT TIME. (Spin used)`);
            }
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to update spin status");
        }
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center py-10">
      <p className="text-sm text-zinc-400 mb-2 italic">Note: 1 Token = 2% Discount</p>
      <div className="relative mb-8 h-64 w-64 overflow-hidden rounded-full border-8 border-orange-600 shadow-[0_0_50px_rgba(234,88,12,0.3)]">
        <motion.div 
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: "circOut" }}
          className="absolute inset-0 h-full w-full bg-[conic-gradient(from_0deg,#ea580c_0deg_90deg,#000_90deg_180deg,#ea580c_180deg_270deg,#000_270deg_360deg)]"
        />
        {/* Draw internal lines to explicitly separate the 4 segments visually */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 left-1/2 w-0.5 h-full bg-zinc-900 -translate-x-1/2"></div>
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-900 -translate-y-1/2"></div>
        </div>

        {/* Labels for the segments */}
        <div className="absolute inset-0 z-10 font-black text-white" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(0, 0.55, 0.45, 1)' }}>
            <span className="absolute top-10 left-[60%] -rotate-45 text-sm">5 TOKENS</span>
            <span className="absolute bottom-10 right-4 rotate-45 text-sm">10 TOKENS</span>
            <span className="absolute bottom-10 left-4 -rotate-45 text-sm">15 TOKENS</span>
            <span className="absolute top-10 right-[60%] rotate-45 text-sm text-orange-600">NOTHING</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center">
            <Trophy className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -ml-2 h-8 w-4 bg-white z-30 rounded-b-full shadow-lg" />
      </div>

      <Button 
        onClick={spin} 
        disabled={spinning || referralCount < 10 || hasSpun}
        className="h-16 w-64 bg-orange-600 text-xl font-black text-black hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600"
      >
        {spinning ? 'SPINNING...' : hasSpun ? 'SPIN USED' : referralCount >= 10 ? 'SPIN NOW (10 REF)' : 'LOCKED (10+ REF)'}
      </Button>
      
      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-sm font-bold uppercase text-zinc-500 mb-2 tracking-[0.3em]">YOUR RESULT</p>
          <h3 className="text-3xl font-black uppercase text-orange-500 italic underline tracking-tighter">{result}</h3>
        </motion.div>
      )}
    </div>
  );
};

// --- Checkout System ---

const CheckoutDialog = ({ product, user, open, onOpenChange, shopStatus }: { product: any, user: User | null, open: boolean, onOpenChange: (open: boolean) => void, shopStatus: { isOpen: boolean } }) => {
  const [gameId, setGameId] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userTokens, setUserTokens] = useState(0);
  const [tokensToUse, setTokensToUse] = useState<number>(0);
  const [showLinkScreen, setShowLinkScreen] = useState(false);

  useEffect(() => {
    if (user && open) {
       setShowLinkScreen(false);
       getDocs(query(collection(db, 'users'), where('uid', '==', user.uid))).then(sn => {
          if (!sn.empty) setUserTokens(sn.docs[0].data().tokens || 0);
       });
    }
  }, [user, open]);

  const discountPercentage = tokensToUse * 2;
  const discountAmount = Math.floor(product?.price * (discountPercentage / 100));
  const finalPrice = Math.max(0, product?.price - discountAmount);

  const handleSubmit = async () => {
    if (!shopStatus.isOpen) {
      toast.error('The shop is currently closed. Please try again later.');
      return;
    }
    if (!user) {
      toast.error('Login required to purchase packs!');
      return;
    }
    if (!gameId.trim()) {
      toast.error('Enter your Game ID (UID)');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Enter the Transaction ID (TrxID)');
      return;
    }
    if (tokensToUse > userTokens) {
      toast.error('You do not have enough tokens!');
      return;
    }

    setSubmitting(true);
    try {
      if (tokensToUse > 0) {
        // deduct tokens locally before order success
        await updateDoc(doc(db, 'users', user.uid), {
             tokens: userTokens - tokensToUse
        });
      }

      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        productId: product.id,
        productName: product.name,
        amount: finalPrice, 
        baseAmount: product.price,
        tokensUsed: tokensToUse,
        discountPercentage: discountPercentage,
        discountAmount: discountAmount,
        gameId: gameId.trim(),
        transactionId: transactionId.trim(),
        paymentMethod: method,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('ORDER TRANSMITTED! Waiting for verification.');
      
      if (product?.link) {
        setShowLinkScreen(true);
      } else {
        onOpenChange(false);
      }
      
      setGameId('');
      setTransactionId('');
      setTokensToUse(0);
    } catch (error) {
      console.error(error);
      toast.error('Mission failed! Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentNumbers = {
    bkash: '01533492344',
    nagad: '01533492344',
    rocket: '01533492344'
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success('NUMBER COPIED TO CLIPBOARD');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md w-[95%] rounded-[2rem] overflow-hidden p-0 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-white to-orange-600 animate-pulse" />
        
        <div className="p-8 space-y-6">
          {showLinkScreen ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-8 py-8"
            >
              <div className="flex justify-center">
                 <div className="h-24 w-24 rounded-full bg-orange-600/10 flex items-center justify-center border border-orange-500/30 shadow-[0_0_50px_rgba(234,88,12,0.2)]">
                    <LinkIcon className="h-10 w-10 text-orange-500" />
                 </div>
              </div>
              <div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">SYSTEM LINK <span className="text-orange-600">READY</span></h3>
                 <p className="text-zinc-500 mt-3 font-bold uppercase tracking-widest text-[10px]">Your order has been recorded. You can access your file below.</p>
              </div>
              <Button 
                onClick={() => window.open(product.link, '_blank')}
                className="w-full bg-white text-black font-black uppercase h-16 rounded-2xl hover:bg-orange-600 hover:text-white transition-all text-lg shadow-[0_0_40px_rgba(234,88,12,0.3)] border-2 border-transparent hover:border-orange-500"
              >
                CLICK AND DOWNLOAD THIS
              </Button>

              <div className="space-y-4 w-full">
                <a href={product.link} target="_blank" rel="noreferrer" className="block text-zinc-400 hover:text-orange-500 text-xs font-mono truncate px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl transition-colors">
                  {product.link}
                </a>
                
                <div className="bg-orange-600 border-2 border-orange-400 rounded-2xl p-6 text-center shadow-2xl">
                  <p className="text-xl sm:text-3xl font-black text-black leading-tight">
                    The top notification option there will send you the ID and password after sometime. Kindly please wait.
                  </p>
                </div>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="text-zinc-500 uppercase font-black text-[10px] tracking-widest hover:text-white mt-4"
              >
                CLOSE TERMINAL
              </Button>
            </motion.div>
          ) : (
            <>
              <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white italic flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-600 fill-orange-600/20" />
              SECURE <span className="text-orange-600">PAYMENT</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">MISSION: AUTHORIZE TRANSACTION</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl flex justify-between items-center backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">VIRTUAL ITEM</p>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter">{product?.name}</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">TOTAL COST</p>
                {tokensToUse > 0 ? (
                  <div className="flex flex-col items-end">
                     <p className="text-sm font-bold text-zinc-500 line-through">{product?.price} TK</p>
                     <p className="text-2xl font-black text-green-500 tracking-tighter">{finalPrice} <span className="text-xs">TK</span></p>
                  </div>
                ) : (
                  <p className="text-2xl font-black text-orange-600 tracking-tighter">{product?.price} <span className="text-xs">TK</span></p>
                )}
              </div>
            </div>

            {/* Token Usage UI */}
            {userTokens > 0 && (
               <div className="border border-orange-600/30 bg-orange-600/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                     <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1"><Star className="h-3 w-3"/> YOUR TOKENS: {userTokens}</p>
                     <p className="text-xs font-bold text-zinc-400">1 Token = 2% OFF</p>
                  </div>
                  <div className="flex gap-2 items-center">
                     <Input 
                        type="number" 
                        min="0" 
                        max={userTokens} 
                        value={tokensToUse} 
                        onChange={e => {
                          let val = parseInt(e.target.value) || 0;
                          if (val > userTokens) val = userTokens;
                          setTokensToUse(val);
                        }} 
                        className="bg-black border-zinc-800 text-white w-24 h-10 font-bold"
                     />
                     <span className="text-sm font-bold text-zinc-400">Tokens to Apply</span>
                  </div>
                  {tokensToUse > 0 && <p className="text-xs text-green-500 mt-2 font-black uppercase">-{discountPercentage}% DISCOUNT APPLIED (-{discountAmount} TK)</p>}
               </div>
            )}

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">PLAYER UID / GAME ID</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                  <Input 
                    value={gameId} 
                    onChange={e => setGameId(e.target.value)} 
                    placeholder="Enter Game ID..." 
                    className="bg-black border-zinc-800 h-14 pl-12 rounded-xl focus:border-orange-500 transition-all font-black uppercase"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 block tracking-widest">DEPLOYMENT CHANNEL</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bkash', 'nagad', 'rocket'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`h-14 border-2 rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden group ${method === m ? 'bg-orange-600/10 border-orange-600 text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                    >
                      {method === m && <motion.div layoutId="selection" className="absolute inset-0 bg-orange-600/5 -z-10" />}
                      <span className="text-[11px] font-black uppercase italic tracking-tighter">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Number Display */}
              <motion.div 
                key={method}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-600/10 border border-orange-600/20 p-5 rounded-3xl relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Logo className="h-20 w-20" />
                </div>
                <p className="text-[10px] font-black text-orange-600 uppercase mb-2 text-center tracking-[0.2em]">SEND MONEY (PERSONAL)</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-3xl font-black text-white tracking-[0.1em]">{paymentNumbers[method]}</p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => copyNumber(paymentNumbers[method])}
                    className="h-8 w-8 text-orange-600 hover:bg-orange-600 hover:text-black rounded-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              <div className="group">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">TRANSACTION ID (TrxID)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                  <Input 
                    value={transactionId} 
                    onChange={e => setTransactionId(e.target.value)} 
                    placeholder="Enter TrxID after sending money..." 
                    className="bg-black border-zinc-800 h-14 pl-12 rounded-xl focus:border-orange-500 transition-all font-black uppercase text-orange-500"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !user || !shopStatus.isOpen}
              className="w-full h-16 bg-white text-black font-black uppercase text-md rounded-2xl hover:bg-orange-600 hover:text-white transition-all transform active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {!shopStatus.isOpen ? 'SHOP CLOSED' : submitting ? 'COMMUNICATING WITH SERVER...' : (
                  <>
                    AUTHORIZE PURCHASE <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </span>
            </Button>
            
            <div className="flex items-start gap-2 px-2">
              <Clock className="h-3 w-3 text-zinc-600 mt-0.5" />
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                AVERAGE VERIFICATION TIME: <span className="text-zinc-400">10-25 MINUTES</span>. SYSTEMS ACTIVE 24/7.
              </p>
            </div>
          </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Marketplace = ({ products, user, shopStatus }: { products: any[], user: User | null, shopStatus: { isOpen: boolean } }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [category, setCategory] = useState('topup');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  const filtered = products.filter(p => {
    if (q) return p.name.toLowerCase().includes(q.toLowerCase());
    return p.category === category;
  });
  
  const categories = [
    { id: 'topup', name: 'TOP UP', icon: Smartphone },
    { id: 'panel', name: 'PANNEL', icon: Sparkles },
    { id: 'bot', name: 'BOT', icon: Bot },
  ];

  return (
    <div className="space-y-8">
      {q ? (
        <div className="flex items-center justify-between bg-orange-600/10 border border-orange-500/20 px-5 py-4 rounded-2xl text-orange-500 shadow-xl shadow-orange-900/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5" />
            <p className="text-sm font-black uppercase tracking-widest">RESULTS FOR: <span className="text-white">"{q}"</span></p>
          </div>
          <Button variant="ghost" onClick={() => setSearchParams({})} className="text-orange-500 hover:text-white hover:bg-orange-600 h-8 text-[10px] font-black tracking-[0.2em] px-4 rounded-xl">
            CLEAR
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button 
              key={c.id}
              variant={category === c.id ? 'default' : 'outline'}
              onClick={() => setCategory(c.id)}
              className={`h-11 font-black px-6 tracking-tighter uppercase rounded-full border-zinc-800 ${category === c.id ? 'bg-orange-600 text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              <c.icon className="h-4 w-4 mr-2" />
              {c.name}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && <p className="text-zinc-500 italic block col-span-full pt-10 text-center uppercase tracking-widest font-black text-sm">No items found matching the current criteria.</p>}
        {filtered.map((p) => (
          <Card key={p.id} className="group relative border-zinc-800 bg-zinc-950 overflow-hidden hover:border-orange-500/50 transition-all">
            <div className="aspect-square relative overflow-hidden bg-zinc-900 border-b border-zinc-800/50">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
                  <Logo className="h-20 w-20 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
              <Badge className="absolute top-4 right-4 bg-orange-600 text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl py-1 px-3 border-none">{p.category}</Badge>
              
              <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                <Button 
                  onClick={() => { setSelectedProduct(p); setCheckoutOpen(true); }}
                  className="w-full bg-white text-black font-black uppercase italic tracking-tighter rounded-xl h-12 shadow-2xl hover:bg-orange-600 hover:text-white"
                >
                  LOAD MISSION
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none flex items-center gap-2">
                    {p.name}
                  </h3>
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2.5 w-2.5 fill-orange-600 text-orange-600" />)}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold mb-6 line-clamp-2 italic tracking-widest uppercase opacity-60 leading-relaxed">{p.description}</p>
              
              <div className="flex items-end justify-between border-t border-zinc-800/50 pt-4">
                <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">STRIKE PRICE</p>
                  <p className="text-3xl font-black text-white flex items-baseline gap-1">
                    {p.price} <span className="text-sm text-orange-600 font-black">TK</span>
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => { setSelectedProduct(p); setCheckoutOpen(true); }}
                  className="bg-orange-600 text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white transition-all px-8 h-12 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95"
                >
                  PURCHASE
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CheckoutDialog 
        product={selectedProduct} 
        user={user} 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen} 
        shopStatus={shopStatus}
      />
    </div>
  );
};

const ReviewSystem = ({ user }: { user: User | null }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % reviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [reviews]);

  const submitReview = async () => {
    if (!user) {
      toast.error('Login to review');
      return;
    }
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });
      setComment('');
      setRating(5);
      toast.success('Review submitted!');
    } catch (error) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const currentReview = reviews[currentIndex];

  return (
    <div className="space-y-12 py-20">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white italic leading-tight">SURVIVOR <br /> <span className="text-orange-600">FEEDBACK</span></h2>
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-2">{reviews.length} ELITE REVIEWS FROM THE SQUAD</p>
        </div>
        
        {user && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-white text-black font-black uppercase tracking-widest px-8 hover:bg-orange-600">DROP FEEDBACK</Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase text-orange-600">LEAVE YOUR MARK</DialogTitle>
                <DialogDescription className="text-zinc-500 uppercase text-[10px] font-bold">Tell the squad how your experience was</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setRating(i)}>
                      <Star className={`h-8 w-8 ${i <= rating ? 'fill-orange-600 text-orange-600' : 'text-zinc-800'}`} />
                    </button>
                  ))}
                </div>
                <Input 
                  placeholder="Your battle report..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-black border-zinc-800 h-24"
                />
                <Button onClick={submitReview} disabled={submitting} className="w-full bg-orange-600 text-black font-black h-12">PUBLISH REVIEW</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative min-h-[200px] flex items-center justify-center">
        {reviews.length === 0 ? (
          <p className="text-zinc-700 italic uppercase font-black tracking-widest">Awaiting field reports...</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12 border border-orange-600/30">
                  <AvatarImage src={currentReview?.userPhoto} />
                  <AvatarFallback className="bg-orange-600 text-white text-lg font-black">{currentReview?.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">{currentReview?.userName}</h4>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < currentReview?.rating ? 'fill-orange-600 text-orange-600' : 'text-zinc-800'}`} />
                    ))}
                  </div>
                </div>
                {currentReview?.isFake && <Badge className="ml-auto bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase tracking-widest">VERIFIED SUCCESS</Badge>}
              </div>
              <p className="text-xl md:text-2xl text-white font-medium italic leading-relaxed">"{currentReview?.comment}"</p>
              <div className="flex justify-center gap-2 mt-8">
                {reviews.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-orange-600' : 'w-2 bg-zinc-800'}`} 
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const authAdminEmails = ['sumisaha1616@gmail.com', 'itsthep.s.0@gmail.com'];

const Navbar = ({ user, notifications = [] }: { user: User | null, notifications?: any[] }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (showNotes && unreadCount > 0) {
      notifications.filter(n => !n.read).forEach(n => {
        updateDoc(doc(db, 'notifications', n.id), { read: true });
      });
    }
  }, [showNotes, notifications, unreadCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  useEffect(() => {
    if (user) {
      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsAdmin(authAdminEmails.includes(user.email || ''));
          setReferralCount(data.referralCount || 0);
          setTokens(data.tokens || 0);
        } else if (authAdminEmails.includes(user.email || '')) {
          setIsAdmin(true);
        }
      }, (error) => {
        console.error("User snapshot error:", error);
      });
      return () => unsubUser();
    }
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-orange-500/20 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">EVEN<span className="text-orange-600">SHOP</span></span>
        </Link>

        {/* Navigation links & Search have been removed to clean up the top side */}

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <Badge variant="outline" className="border-orange-600 border-2 bg-orange-600/10 text-xs font-black text-orange-500 px-3 py-1 animate-pulse">
                  <Star className="h-3 w-3 mr-1 inline" /> {tokens} TOKENS
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-zinc-400 hover:text-orange-500" 
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-600 rounded-full animate-pulse border-2 border-zinc-950 flex items-center justify-center text-[7px] font-black text-white">{unreadCount}</span>}
                  </div>
                </Button>
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-orange-500">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-[300px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tighter text-orange-500">SETTINGS</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Link to="/" onClick={() => setSettingsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-zinc-300 hover:bg-zinc-900 hover:text-orange-500">
                          <HomeIcon className="h-5 w-5" />
                          HOME
                        </Button>
                      </Link>
                      <Link to="/profile" onClick={() => setSettingsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
                          <UserCircle className="h-5 w-5" />
                          PROFILE
                        </Button>
                      </Link>
                      <Dialog open={wheelOpen} onOpenChange={setWheelOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-orange-500 hover:bg-orange-500/10 hover:text-orange-400">
                            <Star className="h-5 w-5" />
                            LUCKY WHEEL
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase italic text-center text-orange-500 tracking-tighter">THE BATTLE WHEEL</DialogTitle>
                            <DialogDescription className="text-center text-zinc-500">At first refer 10 members then you can get a chance for Spin</DialogDescription>
                          </DialogHeader>
                          <LuckyWheel referralCount={referralCount} user={user} />
                        </DialogContent>
                      </Dialog>
                      <Link to="/dashboard" onClick={() => setSettingsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
                          <History className="h-5 w-5" />
                          MY ORDERS
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setSettingsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-orange-500 hover:bg-orange-500/10 hover:text-orange-400">
                            <Settings className="h-5 w-5" />
                            ADMIN DASHBOARD
                          </Button>
                        </Link>
                      )}
                      <div className="h-px bg-zinc-800 my-2" />
                      <Button 
                        onClick={() => { logout(); setSettingsOpen(false); }} 
                        variant="ghost" 
                        className="w-full justify-start gap-3 font-black text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-5 w-5" />
                        LOGOUT
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {showNotes && (
                  <div className="absolute right-0 top-16 mt-2 w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                      <div className="font-black uppercase text-white">Notifications</div>
                      <Button variant="ghost" size="sm" onClick={() => setShowNotes(false)} className="text-[10px] text-zinc-500 hover:text-white font-black uppercase">BACK</Button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="p-8 text-center text-zinc-600">
                          <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p className="font-bold uppercase text-sm">No new messages</p>
                        </div>
                      )}
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                          <p className="text-sm text-white font-medium">{n.message}</p>
                          <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-wider">{n.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/profile" className="flex items-center gap-3 rounded-full border border-orange-500/20 bg-orange-500/5 p-1 pr-3 transition-all hover:bg-orange-500/10">
                <Avatar className="h-8 w-8 border border-orange-500/30">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback className="bg-zinc-800 text-xs text-white">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col md:flex">
                  <span className="text-xs font-bold text-white leading-none">{user.displayName}</span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={signInWithGoogle} className="bg-orange-600 font-black text-black hover:bg-orange-500">
                LOG IN / SIGN UP
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const ScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-orange-600 z-[60] origin-left"
      style={{ scaleX }}
    />
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-24">
      <motion.div 
        style={{ y: y1, opacity }}
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.2),transparent_70%)]" 
      />
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-6 border-orange-600 bg-orange-600/10 text-orange-600 px-6 py-1.5 text-sm font-black italic">
            #1 BD EVEN SHOP
          </Badge>
          <h1 className="mb-8 text-6xl font-black uppercase tracking-tighter text-white md:text-8xl">
            EVEN <br />
            <span className="text-orange-600">SHOP</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-zinc-400 md:text-xl">
            The most advanced Free Fire diamond and panel ecosystem in Bangladesh. 
            Instant delivery, secure payments, and elite tools.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-16 bg-orange-600 px-10 text-xl font-black text-black hover:bg-orange-500 shadow-2xl shadow-orange-600/40"
            >
              GET DIAMONDS
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-16 border-orange-600/50 bg-transparent px-10 text-xl font-black text-white hover:bg-orange-600/10"
            >
              VIEW PANELS
            </Button>
          </div>

          <div className="mt-12 max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-orange-600 z-10" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH FOR DIAMONDS, PANELS, OR BOTS..." 
                className="bg-zinc-900/80 backdrop-blur-xl border-orange-500/30 text-white pl-16 pr-6 h-16 rounded-3xl text-sm md:text-lg font-black tracking-widest placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500 hover:border-orange-500/50 transition-all uppercase shadow-2xl shadow-orange-900/20"
              />
            </form>
          </div>
        </motion.div>
      </div>
      
      {/* Animated background elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-600/10 blur-[100px]"
      />
    </section>
  );
};

const Home = ({ user, shopStatus }: { user: User | null, shopStatus: { isOpen: boolean } }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), where('active', '==', true)), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Home Products Snapshot Error:", error);
    });
    const unsubNotes = onSnapshot(query(collection(db, 'notes'), orderBy('createdAt', 'desc')), (snap) => {
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Home Notes Snapshot Error:", error);
    });
    return () => {
      unsubProducts();
      unsubNotes();
    };
  }, []);

  return (
    <main className="relative z-10">
      {!shopStatus.isOpen && (
        <div className="bg-red-600/20 border-y border-red-500/30 py-4 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-red-500 animate-pulse">
            ⚠️ SYSTEM OFFLINE: THE SHOP IS CURRENTLY CLOSED. PURCHASES ARE DISABLED.
          </p>
        </div>
      )}
      {user && authAdminEmails.includes(user.email || '') && (
        <div className="bg-orange-600 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black">
          ADMIN MODE ACTIVE • FULL SYSTEM ACCESS GRANTED
        </div>
      )}

      {notes.length > 0 && (
        <div className="container mx-auto px-4 pt-8">
          {notes.map(note => (
            <Card key={note.id} className="bg-zinc-900/60 border-zinc-800 border-l-4 border-l-orange-600 overflow-hidden mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Global Notice • Important</span>
                    </div>
                    {note.content && (
                      <p className="text-lg font-bold text-white leading-relaxed tracking-tight">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {note.mediaUrl && (
                    <div className="w-full max-w-4xl">
                      {note.type === 'image' ? (
                        <img src={note.mediaUrl} className="w-full rounded-2xl object-cover border border-zinc-800 max-h-[600px]" referrerPolicy="no-referrer" />
                      ) : note.type === 'video' ? (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                          {note.mediaUrl.includes('youtube.com') || note.mediaUrl.includes('youtu.be') ? (
                            <iframe 
                              src={note.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('&')[0]} 
                              className="w-full h-full" 
                              allowFullScreen 
                            />
                          ) : (
                            <video 
                              src={note.mediaUrl} 
                              controls 
                              className="w-full h-full object-contain cursor-pointer" 
                              onClick={(e) => {
                                if (e.currentTarget.paused) e.currentTarget.play();
                                else e.currentTarget.pause();
                              }}
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  <p className="text-[10px] font-bold text-zinc-600 uppercase mt-2">Posted on {note.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Hero />
      
      <div className="container mx-auto px-4 space-y-32 pb-32">
        <section id="marketplace" className="scroll-mt-24">
          <div className="mb-12">
            <h2 className="text-6xl font-black uppercase tracking-tighter text-white italic leading-none">
              ITEM <span className="text-orange-600">VAULT</span>
            </h2>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.3em] mt-2">Elite Gear & Digital Assets</p>
          </div>
          <Marketplace products={products} user={user} shopStatus={shopStatus} />
        </section>

        <section id="reviews" className="scroll-mt-24">
          <ReviewSystem user={user} />
        </section>
      </div>
    </main>
  );
};

const Dashboard = ({ user }: { user: User | null }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubOrders = onSnapshot(query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')), (snap) => {
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return () => unsubOrders();
    }
  }, [user]);

  if (!user) return <div className="flex h-screen items-center justify-center text-white font-black">PLEASE LOGIN</div>;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">MY <span className="text-orange-600">COMMAND CENTER</span></h1>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-1 italic">Welcome back, {user.displayName}</p>
          </div>
          <Badge className="bg-zinc-900 border border-zinc-800 p-4 h-12 text-orange-600 font-black uppercase tracking-widest">
            ORDER HISTORY
          </Badge>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="h-8 w-8 text-orange-600 animate-spin" />
            </div>
          ) : (
            <>
              {orders.length === 0 && (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
                  <p className="text-zinc-600 italic uppercase font-black tracking-widest mb-4">No active missions found in archive.</p>
                  <Button asChild className="bg-orange-600 text-black font-black uppercase">
                    <Link to="/">VISIT MARKETPLACE</Link>
                  </Button>
                </div>
              )}
              {orders.map((order) => (
                <Card key={order.id} className="border-zinc-800 bg-zinc-900/40">
                  <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                    <div className="flex items-center gap-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-orange-600">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase text-white">{order.productName}</h3>
                        <p className="text-sm font-bold text-zinc-500 uppercase">
                          ID: <span className="text-orange-500">{order.gameId}</span> • {order.amount} TK
                        </p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase mt-1">TrxID: {order.transactionId}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={
                        order.status === 'completed' ? 'bg-green-600 text-black font-black' :
                        order.status === 'pending' ? 'bg-orange-600 text-black font-black' :
                        'bg-red-600 text-black font-black'
                      }>
                        {order.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-bold text-zinc-600">
                        {order.createdAt?.toDate().toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Profile = ({ user }: { user: User | null }) => {
  const [profileData, setProfileData] = useState({ name: '', ffUid: '', referralCode: '', referralCount: 0, hasUsedReferral: false });
  const [inputReferral, setInputReferral] = useState('');
  const [wheelOpen, setWheelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            ffUid: data.ffUid || '',
            referralCode: data.referralCode || generateReferralCode(user.uid),
            referralCount: data.referralCount || 0,
            hasUsedReferral: data.hasUsedReferral || false
          });
          
          if (!data.referralCode) {
            setDoc(doc(db, 'users', user.uid), { referralCode: generateReferralCode(user.uid) }, { merge: true });
          }
        }
      }, (error) => {
        console.error("Profile snapshot error:", error);
      });
      return () => unsub();
    }
  }, [user]);

  const handleApplyReferral = async () => {
    if (!inputReferral || !user || isApplying) return;
    if (profileData.hasUsedReferral) {
      toast.error('You have already used a referral code');
      return;
    }
    setIsApplying(true);
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', inputReferral.toUpperCase()));
      const s = await getDocs(q);
      
      if (s.empty) {
        toast.error('Invalid code');
      } else {
        const referrerDoc = s.docs[0];
        if (referrerDoc.id === user.uid) {
          toast.error('Cannot refer self');
        } else {
          // Double check document data before proceeding
          const referrerData = referrerDoc.data();
          
          // Update referrer count
          await updateDoc(referrerDoc.ref, { 
            referralCount: (referrerData.referralCount || 0) + 1 
          });
          // Mark current user as having used a referral
          await updateDoc(doc(db, 'users', user.uid), { 
            hasUsedReferral: true,
            referredBy: referrerDoc.id,
            updatedAt: serverTimestamp()
          });
          toast.success('Code applied!');
          setInputReferral('');
        }
      }
    } catch (error) {
      console.error("Referral check error:", error);
      toast.error('Error applying code');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        email: user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <UserCircle className="mb-6 h-20 w-20 text-zinc-800" />
      <h2 className="mb-2 text-2xl font-black uppercase text-white">NOT LOGGED IN</h2>
      <p className="mb-8 text-zinc-500">Please log in to view and manage your profile.</p>
      <Button onClick={signInWithGoogle} className="bg-orange-600 font-black text-black">LOG IN / SIGN UP</Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl"
        >
          <div className="relative h-32 bg-gradient-to-r from-orange-600 to-orange-900">
            <div className="absolute -bottom-12 left-8">
              <Avatar className="h-24 w-24 border-4 border-zinc-900 bg-zinc-800 shadow-2xl">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="text-2xl font-black text-white">{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <div className="p-8 pt-16">
            <div className="mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{user.displayName}</h2>
              <p className="text-sm font-bold text-orange-500">{user.email}</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Full Name</label>
                <Input 
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="border-zinc-800 bg-zinc-950/50 text-white focus:border-orange-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Free Fire UID</label>
                <Input 
                  value={profileData.ffUid}
                  onChange={(e) => setProfileData({ ...profileData, ffUid: e.target.value })}
                  className="border-zinc-800 bg-zinc-950/50 text-white focus:border-orange-500"
                  placeholder="Enter your FF UID"
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="mt-4 bg-orange-600 font-black text-black hover:bg-orange-500"
              >
                {isSaving ? 'SAVING...' : 'SAVE PROFILE'}
              </Button>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="rounded-2xl bg-orange-600/10 p-6 border border-orange-600/20 text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Members Referred</p>
                  <p className="text-4xl font-black text-orange-500 tracking-tighter">{profileData.referralCount}</p>
                </div>
                <div className="rounded-2xl bg-zinc-950/50 p-6 border border-zinc-800 text-center flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Status</p>
                  <p className="text-sm font-black text-white uppercase italic">{profileData.referralCount >= 10 ? 'LUCKY SPINNER UNLOCKED' : '10 REFS FOR SPIN'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-zinc-950/50 p-6 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase text-orange-500">
                    <Gift className="h-4 w-4" />
                    Invite Friends
                  </h3>
                </div>
                
                <div className="p-4 rounded-xl bg-orange-600/5 border border-orange-600/10 text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Your Referral Code</p>
                  <p className="text-xl font-black tracking-[0.5em] text-white underline decoration-orange-600 underline-offset-8">
                    {profileData.referralCode}
                  </p>
                </div>

                {!profileData.hasUsedReferral && (
                  <div className="grid gap-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500">Have a code?</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="ENTER CODE" 
                        value={inputReferral}
                        onChange={(e) => setInputReferral(e.target.value.toUpperCase())}
                        className="border-zinc-800 bg-black text-xs font-black tracking-widest"
                      />
                      <Button onClick={handleApplyReferral} disabled={isApplying} className="bg-zinc-800 font-black hover:bg-zinc-700">
                        {isApplying ? '...' : 'APPLY'}
                      </Button>
                    </div>
                  </div>
                )}

                <Dialog open={wheelOpen} onOpenChange={setWheelOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 font-black text-black py-6">
                      <Trophy className="mr-2 h-5 w-5" />
                      OPEN LUCKY WHEEL
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase italic italic text-center text-orange-500 tracking-tighter">THE BATTLE WHEEL</DialogTitle>
                      <DialogDescription className="text-center text-zinc-500">Refer 10 members to unlock the divine rewards.</DialogDescription>
                    </DialogHeader>
                    <LuckyWheel referralCount={profileData.referralCount} user={user} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900/20">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-black uppercase text-zinc-500">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-bold uppercase">Verified Member</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/20">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-black uppercase text-zinc-500">Join Date</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-sm font-bold text-white uppercase">{new Date(user.metadata.creationTime || '').toLocaleDateString()}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Admin = ({ user, shopStatus }: { user: User | null, shopStatus: { isOpen: boolean } }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'topup', imageUrl: '', link: '' });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMsgDialog, setShowMsgDialog] = useState(false);
  const [targetOrder, setTargetOrder] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [showGalleryPicker, setShowGalleryPicker] = useState<string | null>(null); // 'note' | 'product' | 'edit' | null
  const prevOrderCount = useRef<number | null>(null);
  const prevSupportCount = useRef<number | null>(null);

  const triggerSound = (type: 'order' | 'support') => {
    const audio = new Audio(type === 'order' ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.play().catch(() => {});
  };

  const pushNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/flame.svg" });
    }
  };

  useEffect(() => {
    if (isAdmin && orders.length > 0) {
      if (prevOrderCount.current !== null && orders.length > prevOrderCount.current) {
        const latest = orders[0];
        if (latest.status === 'pending') {
          triggerSound('order');
          pushNotification("New Order Alert!", `${latest.userName} has placed an order for ${latest.productName}`);
        }
      }
      prevOrderCount.current = orders.length;
    }
  }, [orders, isAdmin]);

  useEffect(() => {
    if (isAdmin && supportMessages.length > 0) {
      if (prevSupportCount.current !== null && supportMessages.length > prevSupportCount.current) {
        const latest = supportMessages[0];
        if (latest.type === 'user') {
          triggerSound('support');
          pushNotification("New Message Received", `${latest.userName}: ${latest.text.slice(0, 50)}...`);
        }
      }
      prevSupportCount.current = supportMessages.length;
    }
  }, [supportMessages, isAdmin]);
  
  // Notes states
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState({ type: 'text', content: '', mediaUrl: '' });
  const [showAddNote, setShowAddNote] = useState(false);

  // Review management states
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editPreviewRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, []);

  const stats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (Number(o.amount) || 0), 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalUsers: users.length,
    totalProducts: products.length
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const words = q.split(/\s+/);
    const targetString = `${o.userName} ${o.userEmail} ${o.transactionId} ${o.gameId} ${o.productName} ${o.paymentMethod} ${o.status}`.toLowerCase();
    return words.every(word => targetString.includes(word));
  });

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const words = q.split(/\s+/);
    const targetString = `${p.name} ${p.description} ${p.category}`.toLowerCase();
    return words.every(word => targetString.includes(word));
  });

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const words = q.split(/\s+/);
    const targetString = `${u.displayName} ${u.email} ${u.referralCode} ${u.role} ${u.id}`.toLowerCase();
    return words.every(word => targetString.includes(word));
  });

  const getMediaType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
    const lowercaseUrl = url.toLowerCase().split('?')[0]; // Remove query params for extension check
    if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext)) || url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'video';
    }
    return 'image';
  };

  const handleFileUpload = async (file: File, target: 'gallery' | 'note' | 'product' | 'edit' = 'gallery') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.imageUrl) {
        await addDoc(collection(db, 'gallery'), {
          url: data.imageUrl,
          createdAt: serverTimestamp()
        });
        
        const isVideo = file.type.startsWith('video/');

        if (target === 'edit' && editingProduct) {
          setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl });
        } else if (target === 'product') {
          setNewProduct({ ...newProduct, imageUrl: data.imageUrl });
        } else if (target === 'note') {
          setNewNote({ ...newNote, mediaUrl: data.imageUrl, type: isVideo ? 'video' : 'image' });
        }
        
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded!`);
        return data.imageUrl;
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
    return null;
  };

  useEffect(() => {
    if (user) {
      setIsAdmin(authAdminEmails.includes(user.email || ''));
      setCheckingAdmin(false);
      // Ensure backend knows they are admin
      if (authAdminEmails.includes(user.email || '')) {
         setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true }).catch(() => {});
      }
    } else {
      setCheckingAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Admin orders snapshot error:", error);
      });
      const unsubProducts = onSnapshot(query(collection(db, 'products')), (snap) => {
        const fetchedProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedProducts.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setProducts(fetchedProducts);
      }, (error) => {
        console.error("Admin products snapshot error:", error);
      });
      const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('referralCount', 'desc')), (snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Admin users snapshot error:", error);
      });
      const unsubSupport = onSnapshot(query(collection(db, 'support'), orderBy('createdAt', 'desc')), (snap) => {
        setSupportMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Admin support snapshot error:", error);
      });
      const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (snap) => {
        setGallery(snap.docs.map(doc => doc.data().url));
      }, (error) => {
        console.error("Admin gallery snapshot error:", error);
      });
      const unsubNotes = onSnapshot(query(collection(db, 'notes'), orderBy('createdAt', 'desc')), (snap) => {
        setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Admin notes snapshot error:", error);
      });
      return () => {
        unsubOrders();
        unsubProducts();
        unsubUsers();
        unsubSupport();
        unsubGallery();
        unsubNotes();
      };
    }
  }, [isAdmin]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: Number(newProduct.price),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', description: '', price: '', category: 'topup', imageUrl: '', link: '' });
      setShowAddProduct(false);
      toast.success('Product published!');
    } catch (error) {
      toast.error('Failed to publish');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        ...editingProduct,
        price: Number(editingProduct.price),
        updatedAt: serverTimestamp()
      });
      setEditingProduct(null);
      toast.success('Product updated!');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product removed');
    } catch (error: any) {
      console.error('Delete error detailed:', error);
      toast.error(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const seedFakeReviews = async () => {
    const longComments = [
      "I was initially hesitant about using a new top-up service, but my experience with this shop has been absolutely fantastic. The website interface is clean and user-friendly, and the entire transaction process was completed seamlessly without any issues. Highly recommended for anyone looking for a reliable service.",
      "অনেকদিন ধরে আমি একটি বিশ্বস্ত দোকানের খোঁজ করছিলাম, অবশেষে এখানে এসে সব চিন্তা দূর হলো। ইন্টারফেসটা খুব সুন্দর এবং ব্যবহার করা অনেক সহজ। আমি আমার আইডি নিয়ে খুব চিন্তিত ছিলাম, কিন্তু এখানে কোনো ঝামেলা ছাড়াই সব পেয়েছি। ৫ স্টার!",
      "Honestly, this is one of the best platforms for gamers I have come across. The support team is incredibly responsive and helpful, making the whole experience stress-free. I have used their service multiple times now and haven't had a single complaint. Truly professional team.",
      "সত্যি অসাধারণ একটি অভিজ্ঞতা। আমি আগে অনেক জায়গায় ঠকেছি কিন্তু এখানে সার্ভিস একদম জেনুইন। পেমেন্ট করার ২ মিনিটের মধ্যেই আমি সব সার্ভিস পেয়েছি। খুব সাবলীল এবং নির্ভরযোগ্য একটি সাইট, সবাই ট্রাই করতে পারেন।",
      "Great service, it is rare to find such honest websites these days. Everything from the login process to the final receipt is top-tier. I am very impressed with their professionalism and speed. Keep up the excellent work!",
      "সাপোর্ট টিমের কথা বলাটা সত্যিই আন্তরিক, আমার সব সমস্যার সমাধান তারা খুব দ্রুত করে দিয়েছে এবং সবসময় তারা অনেক সাহায্য করে। প্যানেলটা একদম ঠিকঠাক কাজ করছে এবং আমি অনেক দিন ধরেই এখান থেকে সার্ভিস নিয়ে সন্তুষ্ট।",
      "Very professional and reliable shop. I really appreciate how quick the response time is and the security of the payment method is unquestionable. I've recommended this shop to all my gaming friends and they are all happy with it as well.",
      "পুরোপুরি বিশ্বস্ত এবং নিরাপদ একটি দোকান। যারা গেমার, তাদের জন্য এই সাইটটি সেরা সমাধান। ইউজার ইন্টারফেস অনেক চমৎকার এবং কাজের গতিও খুব দ্রুত। আমি ভবিষ্যতে আবারও এখান থেকে সার্ভিস নেব।"
    ];

    const names = [
      "Rahim","Karim","Fatima","Ayesha","Samiul","Nusrat","Tanzim","Sumaiya","Mehedi","Farjana",
      "Tanvir","Shanta","Rakib","Priya","Arif","Sabrina","Imran","Nazmul","Fahim","Tania",
      "Abir","Sadia","Sakib","Jannat","Hasan","Mim","Ridoy","Riya","Sabbir","Mou",
      "Anik","Sathi","Nipun","Dola","Akash","Tisha","Joy","Puja","Rafi","Mahima",
      "Shahed","Nila","Munna","Rupa","Faysal","Hira","Shuvo","Laboni","Zihad","Keya",
      "Bijoy","Maya","Milon","Poly","Sumon","Shimu","Rabbi","Tumpa","Sifat","Jui",
      "Rony","Sonia","Rifat","Sorna","Bappy","Mitu","Masud","Rina","Pavel","Shila"
    ];
    
    try {
      toast.info('Seeding 60 Unique Long Reviews...');
      for (let i = 0; i < names.length; i++) {
        await addDoc(collection(db, 'reviews'), {
          userName: names[i],
          rating: Math.random() > 0.5 ? 5 : 4,
          comment: longComments[i % longComments.length],
          createdAt: serverTimestamp(),
          isFake: true,
          userId: 'fake-' + Date.now() + i,
          userPhoto: ""
        });
      }
      toast.success('60 Long Reviews seeded!');
    } catch (error) {
      toast.error('Failed to seed');
    }
  };

  const clearMarketplace = async () => {
    try {
      const q = query(collection(db, 'products'));
      const snap = await getDocs(q);
      const batch: any[] = [];
      snap.forEach(d => batch.push(deleteDoc(d.ref)));
      await Promise.all(batch);
      toast.success('Marketplace Purged');
    } catch (error: any) {
      console.error('Purge error detailed:', error);
      toast.error(`Purge Failed: ${error.message || 'Unknown error'}`);
    }
  };

  const wipeAllReviews = async () => {
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const batch: any[] = [];
      snap.forEach(d => batch.push(deleteDoc(d.ref)));
      await Promise.all(batch);
      toast.success('All reviews wiped successfully.');
    } catch (error: any) {
      console.error('Wipe error:', error);
      toast.error('Failed to wipe reviews');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content && !newNote.mediaUrl) return;
    try {
      await addDoc(collection(db, 'notes'), {
        ...newNote,
        createdAt: serverTimestamp()
      });
      setNewNote({ type: 'text', content: '', mediaUrl: '' });
      setShowAddNote(false);
      toast.success('Note added!');
    } catch (e) {
      toast.error('Failed to add note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      toast.success('Note removed');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const sendAdminMessage = async () => {
    if (!targetOrder || !adminMessage.trim()) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetOrder.userId,
        message: adminMessage.trim(),
        createdAt: serverTimestamp(),
        read: false
      });
      toast.success('Message sent to user!');
      setAdminMessage('');
      setShowMsgDialog(false);
      setTargetOrder(null);
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          message: `Your order for ${order.productName} has been ${status}.`,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      toast.success(`Order ${status}`);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      toast.success(`User role updated to ${role}`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const sendReply = async (userId: string) => {
    const text = replyText[userId];
    const thread = getThread(userId);
    const lastUserMsg = thread.find(m => m.type === 'user');
    
    if (!text?.trim()) return;
    try {
      await addDoc(collection(db, 'support'), {
        userId,
        userEmail: lastUserMsg?.userEmail || '',
        userName: lastUserMsg?.userName || '',
        text: text.trim(),
        type: 'admin',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'notifications'), {
        userId,
        message: `New message from Admin: ${text.trim().slice(0, 50)}...`,
        createdAt: serverTimestamp(),
        read: false
      });
      setReplyText({ ...replyText, [userId]: '' });
      toast.success('Reply sent!');
    } catch (error) {
      toast.error('Failed to reply');
    }
  };

  const filteredSupport = supportMessages.filter((m, index, self) => {
    // Only show unique users in the list, then we show their thread
    return index === self.findIndex((t) => t.userId === m.userId);
  }).filter(m => {
    const q = searchQuery.toLowerCase();
    return (m.userName || '').toLowerCase().includes(q) || 
           (m.userEmail || '').toLowerCase().includes(q) ||
           (m.text || '').toLowerCase().includes(q);
  });

  const getThread = (userId: string) => {
    return supportMessages.filter(m => m.userId === userId).sort((a, b) => {
      const dateA = a.createdAt?.toDate() || 0;
      const dateB = b.createdAt?.toDate() || 0;
      return dateA - dateB;
    });
  };
  if (checkingAdmin) return <div className="flex h-screen items-center justify-center text-white font-black animate-pulse">VERIFYING ADMIN STATUS...</div>;
  if (!isAdmin) return <div className="flex h-screen items-center justify-center text-white font-black">ACCESS DENIED</div>;

  return (
      <div className="min-h-screen bg-black">
        <Dialog open={showMsgDialog} onOpenChange={setShowMsgDialog}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-2xl w-full max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase text-orange-500 tracking-tighter">
                Send Message to {targetOrder?.userName || 'User'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                value={adminMessage} 
                onChange={e => setAdminMessage(e.target.value)} 
                placeholder="Type your message..." 
                className="bg-black border-zinc-800 text-white h-12 rounded-xl focus:border-orange-500 focus:ring-orange-500" 
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowMsgDialog(false)} className="text-zinc-500 hover:text-white">Cancel</Button>
              <Button 
                onClick={sendAdminMessage} 
                className="bg-orange-600 text-black font-black hover:bg-orange-500 rounded-xl px-6"
                disabled={!adminMessage.trim()}
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex flex-col lg:flex-row">
        {/* Admin Sidebar */}
        <div className="w-full lg:w-64 bg-zinc-950 border-r border-zinc-800 p-6 space-y-8">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">ADMIN<span className="text-orange-600">HUB</span></h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Management v2.0</p>
            </div>
          </Link>
          
          <nav className="space-y-2">
            {[
              { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Manage Orders', icon: ShoppingCart },
              { id: 'products', label: 'Marketplace', icon: Zap },
              { id: 'gallery', label: 'Asset Gallery', icon: Star },
              { id: 'users', label: 'User Control', icon: Users },
              { id: 'support', label: 'Support Inquiries', icon: History },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'notes', label: 'Notes', icon: Edit },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-black uppercase transition-all ${
                  activeTab === item.id 
                  ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <Card className="bg-orange-600/5 border-orange-600/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-black text-orange-600 uppercase">Live Server Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Authenticated & Connected</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Content Area */}
        <div className="flex-1 p-4 md:p-10 bg-[radial-gradient(ellipse_at_top_right,rgba(234,88,12,0.05),transparent)]">
          <div className="container mx-auto">
            {activeTab === 'stats' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Revenue', value: `${stats.totalRevenue} TK`, icon: DollarSign, color: 'text-green-500' },
                    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-500' },
                    { label: 'Active Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                    { label: 'Offers listed', value: stats.totalProducts, icon: Zap, color: 'text-purple-500' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-zinc-800 bg-zinc-900/40">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.label}</p>
                            <h3 className={`mt-1 text-3xl font-black ${stat.color}`}>{stat.value}</h3>
                          </div>
                          <div className={`rounded-xl bg-zinc-800 p-3 ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">RECENT DEPOSITS</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex flex-wrap items-center justify-between border-b border-zinc-800/50 pb-4 gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-orange-600 font-black uppercase">
                              {order.userName?.charAt(0) || order.userEmail?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase truncate max-w-[200px]">{order.userName || order.userEmail?.split('@')[0] || 'Customer'}</p>
                              <p className="text-[10px] font-bold text-zinc-600">{order.amount} TK via {order.paymentMethod}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={
                              order.status === 'completed' ? 'bg-green-600 text-black font-black' : 
                              order.status === 'pending' ? 'bg-orange-600 text-black font-black' : 
                              'bg-red-600 text-black font-black'
                            }>
                              {order.status}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => { navigator.clipboard.writeText(order.transactionId || ''); toast.success('TrxID copied!'); }}>
                              <span className="sr-only">Copy TrxID</span>
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => { setTargetOrder(order); setShowMsgDialog(true); }}>
                              <span className="sr-only">Message User</span>
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-zinc-800 text-[10px] font-black uppercase" onClick={() => setActiveTab('orders')}>
                        VIEW ALL TRANSACTIONS
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">ELITE REFERRERS</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {users.slice(0, 5).map((u, i) => (
                        <div key={u.id} className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-zinc-800">#0{i+1}</span>
                            <div>
                              <p className="text-sm font-black text-white uppercase">{u.displayName || 'Unknown'}</p>
                              <p className="text-[10px] font-bold text-zinc-600">CODE: {u.referralCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white">{u.referralCount || 0}</p>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase">REFERRALS</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">ORDER <span className="text-orange-600">QUEUE</span></h2>
                  <Badge className="bg-zinc-800 text-zinc-400 font-bold uppercase">{orders.length} TOTAL</Badge>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input 
                      placeholder="Search orders..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border-zinc-800 pl-12 h-12 font-bold uppercase text-[10px] tracking-widest focus:border-orange-500 text-black placeholder:text-zinc-500"
                    />
                  </div>
                </div>
                <div className="grid gap-6">
                  {filteredOrders.map(order => (
                    <Card key={order.id} className="border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all border-l-4 border-l-orange-600">
                      <CardContent className="flex flex-col xl:flex-row items-center justify-between p-8 gap-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 w-full">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Customer</p>
                            <h3 className="text-lg font-black uppercase text-white truncate">{order.userName || order.userEmail?.split('@')[0] || 'Customer'}</h3>
                            <p className="text-xs font-bold text-zinc-500 lowercase">{order.userEmail}</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">FF Package</p>
                            <p className="text-sm font-bold text-white uppercase"><span className="text-orange-500">{order.productName}</span></p>
                            <p className="text-xs font-black text-zinc-400 lowercase tracking-tighter">UID: <span className="text-orange-600 text-base">{order.gameId}</span></p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Payment Verification</p>
                            <p className="text-sm font-black text-green-500">{order.amount} TK via {order.paymentMethod?.toUpperCase()}</p>
                            <p className="text-xs font-black text-blue-500 uppercase font-mono bg-blue-500/10 inline-block px-2 py-0.5 rounded">ID: {order.transactionId}</p>
                            {order.tokensUsed > 0 && (
                              <div className="mt-1 flex flex-col gap-1 border-t border-zinc-800/50 pt-1">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 inline-block px-2 py-0.5 rounded w-fit">⚡ {order.tokensUsed} TOKENS USED</span>
                                <span className="text-[10px] font-bold text-green-400">-{order.discountPercentage}% OFF (-{order.discountAmount} TK)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 w-full xl:w-auto min-w-[200px]">
                          <div className="flex gap-2 w-full">
                            {order.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-green-600 font-black text-black hover:bg-green-500 shadow-lg shadow-green-600/10">APPROVE</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')} className="flex-1 font-black">REJECT</Button>
                              </>
                            )}
                          </div>
                          <Badge className={`w-full text-center justify-center h-10 text-xs font-black uppercase tracking-widest ${
                            order.status === 'completed' ? 'bg-green-600 text-black shadow-lg shadow-green-600/30' :
                            order.status === 'pending' ? 'bg-orange-600 text-black animate-pulse shadow-lg shadow-orange-600/30' :
                            'bg-red-600 text-black'
                          }`}>
                            {order.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">ASSET <span className="text-orange-600">GALLERY</span></h2>
                  <Button onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 font-black hover:bg-zinc-700">UPLOAD NEW ASSET</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {gallery.length === 0 && <p className="text-zinc-600 italic col-span-full">No assets uploaded yet.</p>}
                  {gallery.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                      <img src={url} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={async () => {
                            if(confirm('Delete from gallery?')) {
                              const q = query(collection(db, 'gallery'), where('url', '==', url));
                              const s = await getDocs(q);
                              s.forEach(d => deleteDoc(d.ref));
                              toast.success('Asset removed');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">USER <span className="text-blue-600">DATABASE</span></h2>
                  <Badge className="bg-zinc-800 text-zinc-400 font-bold uppercase">{users.length} TOTAL</Badge>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input 
                      placeholder="Search users by name, email, code or UID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border-zinc-800 pl-12 h-12 font-bold uppercase text-[10px] tracking-widest focus:border-orange-500 text-black placeholder:text-zinc-500"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-600">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4 text-center">Referrals</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-900/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.photoURL} />
                                <AvatarFallback className="bg-zinc-800 text-xs text-white">{u.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-black text-white uppercase text-xs">{u.displayName || 'Unknown'}</p>
                                <p className="text-[10px] lowercase text-zinc-600">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-white">{u.referralCount || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={u.role === 'admin' ? 'bg-orange-600 text-black font-black' : 'border-zinc-800'}>
                              {u.role?.toUpperCase() || 'USER'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.role === 'admin' ? (
                              <Button variant="ghost" size="sm" onClick={() => updateUserRole(u.id, 'user')} className="text-red-500 font-bold text-xs uppercase">DEMOTE</Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => updateUserRole(u.id, 'admin')} className="text-orange-600 font-bold text-xs uppercase">PROMOTE</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">REVIEWS <span className="text-orange-600">MODERATION</span></h2>
                  <div className="flex gap-2">
                    <Button onClick={wipeAllReviews} className="bg-red-900/20 text-red-500 font-bold hover:bg-red-900/40">CLEAR ALL REVIEWS</Button>
                    <Button onClick={seedFakeReviews} className="bg-zinc-800 text-zinc-400 font-bold hover:bg-zinc-700">SEED FAKE</Button>
                  </div>
                </div>
                
                <Card className="border-orange-600/20 bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-black text-white mb-4">Add New Review Manually</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="User Name" value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="bg-black border-zinc-800" />
                    <Input type="number" min="1" max="5" placeholder="Rating (1-5)" value={newReviewRating} onChange={e => setNewReviewRating(parseInt(e.target.value))} className="bg-black border-zinc-800" />
                    <Input placeholder="Comment" value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} className="bg-black border-zinc-800 md:col-span-2" />
                    <Button onClick={async () => {
                      if (!newReviewName || !newReviewComment) return;
                      await addDoc(collection(db, 'reviews'), {
                        userName: newReviewName,
                        rating: newReviewRating || 5,
                        comment: newReviewComment,
                        createdAt: serverTimestamp(),
                        isFake: true,
                        userId: 'admin-added-' + Date.now(),
                        userPhoto: ""
                      });
                      setNewReviewName(''); setNewReviewComment(''); setNewReviewRating(5);
                      toast.success('Review added!');
                    }} className="bg-orange-600 text-black font-black w-full md:col-span-2 uppercase">Publish Review</Button>
                  </div>
                </Card>
                
                <div className="grid gap-4">
                  {reviews.length === 0 && <p className="text-zinc-600 italic">No reviews yet.</p>}
                  {reviews.map(r => (
                    <Card key={r.id} className="border-zinc-800 bg-zinc-900/40">
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={r.userPhoto} />
                            <AvatarFallback className="bg-zinc-800 text-white font-black text-xs">{r.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white uppercase text-sm">{r.userName}</p>
                              {r.isFake && <Badge className="text-[8px] bg-green-500/10 text-green-500 border-none">FAKE</Badge>}
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-2.5 w-2.5 ${i < r.rating ? 'fill-orange-600 text-orange-600' : 'text-zinc-800'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 italic">"{r.comment}"</p>
                          </div>
                        </div>
                        <Button variant="ghost" onClick={() => deleteReview(r.id)} className="text-red-500 hover:bg-red-500/10">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">ITEM <span className="text-orange-600">VAULT</span></h2>
                  <div className="flex gap-2">
                    <Button onClick={clearMarketplace} variant="destructive" size="sm" className="font-black uppercase tracking-widest bg-red-950/20 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">PURGE STORE</Button>
                    <Button onClick={() => setShowAddProduct(!showAddProduct)} className="bg-orange-600 text-black font-black">
                      {showAddProduct ? 'CANCEL' : 'ADD NEW PACK'}
                    </Button>
                  </div>
                </div>

                {showAddProduct && (
                  <Card className="border-orange-500/20 bg-zinc-900 overflow-hidden">
                    <CardHeader className="bg-orange-500/10 border-b border-orange-500/20">
                      <CardTitle className="text-orange-500 uppercase font-black tracking-tighter">Create New Listing</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase">Pack Title</label>
                          <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-black" placeholder="e.g. 100 DIAMONDS" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase">Category</label>
                          <select 
                            value={newProduct.category} 
                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                            className="w-full bg-black border border-zinc-800 rounded-md h-10 px-3 text-xs font-black uppercase text-white outline-none focus:border-orange-500"
                          >
                            <option value="topup">TOP UP</option>
                            <option value="panel">PANNEL</option>
                            <option value="bot">BOT</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase">Market Price (TK)</label>
                          <Input value={newProduct.price} type="number" onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="bg-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase">Offer Detail</label>
                          <Input value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="bg-black" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase">External Link (Optional)</label>
                          <Input placeholder="e.g. https://example.com/tutorial" value={newProduct.link || ''} onChange={e => setNewProduct({...newProduct, link: e.target.value})} className="bg-black" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-zinc-500 uppercase block">Product Image</label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowGalleryPicker(showGalleryPicker === 'product' ? null : 'product')}
                            className="h-6 text-[8px] font-black uppercase text-orange-600 hover:bg-orange-600/10"
                          >
                            {showGalleryPicker === 'product' ? 'Close Gallery' : 'Choose from Gallery'}
                          </Button>
                        </div>

                        {showGalleryPicker === 'product' && (
                          <div className="grid grid-cols-5 md:grid-cols-8 gap-2 border border-zinc-800 p-3 rounded-xl bg-black/60 max-h-48 overflow-y-auto mb-4">
                            {gallery.map((url, i) => (
                              <button 
                                key={url + i}
                                type="button"
                                onClick={() => {
                                  setNewProduct({...newProduct, imageUrl: url});
                                  setShowGalleryPicker(null);
                                }}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all group ${newProduct.imageUrl === url ? 'border-orange-600' : 'border-transparent'}`}
                              >
                                <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input 
                            value={newProduct.imageUrl} 
                            onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} 
                            className="bg-black text-white" 
                            placeholder="Image URL" 
                          />
                          <label className="cursor-pointer">
                            <Input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'product');
                              }}
                            />
                            <div className="border border-zinc-800 hover:border-orange-600 hover:bg-orange-600/10 h-10 w-10 p-0 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-orange-600 transition-colors">
                              <Plus className="h-4 w-4" />
                            </div>
                          </label>
                        </div>
                      </div>
                      <Button onClick={handleAddProduct} className="w-full bg-orange-600 text-black font-black h-12 uppercase">PUBLISH TO MARKETPLACE</Button>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input 
                      placeholder="Search items..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border-zinc-800 pl-12 h-12 font-bold uppercase text-[10px] tracking-widest focus:border-orange-500 text-black placeholder:text-zinc-500"
                    />
                  </div>
                </div>
                <div className="grid gap-4">
                  {filteredProducts.map(p => (
                    <Card key={p.id} className="border-zinc-800 bg-zinc-900/40">
                      <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                        <div className="h-20 w-20 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-600">
                              <Diamond className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          {editingProduct?.id === p.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Package Name</label>
                                <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="bg-black border-orange-500/50" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Market Price (TK)</label>
                                <Input value={editingProduct.price} type="number" onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="bg-black border-orange-500/50" />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Offer Detail</label>
                                <Input value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="bg-black border-orange-500/50" />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">External Link (Optional)</label>
                                <Input value={editingProduct.link || ''} onChange={e => setEditingProduct({...editingProduct, link: e.target.value})} className="bg-black border-orange-500/50" placeholder="https://example.com" />
                              </div>
                              <div className="space-y-1 md:col-span-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Category</label>
                                <select 
                                  value={editingProduct.category} 
                                  onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                                  className="w-full bg-black border border-zinc-800 rounded-md h-10 px-3 text-xs font-black uppercase text-white outline-none focus:border-orange-500"
                                >
                                  <option value="topup">TOP UP</option>
                                  <option value="panel">PANNEL</option>
                                  <option value="bot">BOT</option>
                                </select>
                              </div>
                              <div className="space-y-1 md:col-span-1">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Gallery Picker</label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowGalleryPicker(showGalleryPicker === `edit-${p.id}` ? null : `edit-${p.id}`)}
                                    className="h-4 text-[7px] font-black uppercase text-orange-600"
                                  >
                                    {showGalleryPicker === `edit-${p.id}` ? 'HIDE' : 'SHOW'}
                                  </Button>
                                </div>
                                {showGalleryPicker === `edit-${p.id}` && (
                                  <div className="grid grid-cols-4 gap-1 p-2 bg-black border border-zinc-800 rounded-lg max-h-32 overflow-y-auto mb-2">
                                    {gallery.map((url, i) => (
                                      <button 
                                        key={url + i} 
                                        onClick={() => {
                                          setEditingProduct({...editingProduct, imageUrl: url});
                                          setShowGalleryPicker(null);
                                        }}
                                        className={`h-8 w-8 rounded-md overflow-hidden border transition-all ${editingProduct.imageUrl === url ? 'border-orange-600' : 'border-zinc-800'}`}
                                      >
                                        <img src={url} className="h-full w-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <input 
                                  type="file" 
                                  hidden 
                                  ref={editPreviewRef}
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'edit')}
                                />
                                <Button variant="outline" size="sm" onClick={() => editPreviewRef.current?.click()} className="w-full border-zinc-700 bg-zinc-950 text-[10px] font-black uppercase h-10" disabled={uploading}>
                                  {uploading ? 'UPLOADING...' : 'CHANGE LISTING PHOTO'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black uppercase text-white tracking-widest">{p.name}</h4>
                                <Badge className="bg-orange-600/10 text-orange-600 font-black text-[10px] border border-orange-600/20">{p.category.toUpperCase()}</Badge>
                              </div>
                              <p className="text-sm text-zinc-500 font-medium italic">{p.description}</p>
                              <div className="flex items-center gap-3">
                                <p className="text-2xl font-black text-orange-600 tracking-tighter">{p.price} TK</p>
                                <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 font-bold uppercase">Public Price</Badge>
                                {p.link && (
                                  <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-bold ml-2">
                                    <LinkIcon className="h-3 w-3" />
                                    Link
                                  </a>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 self-end md:self-center">
                          {editingProduct?.id === p.id ? (
                            <>
                              <Button onClick={handleUpdateProduct} variant="ghost" className="text-green-500 font-black hover:bg-green-500/10"><CheckCircle2 className="h-6 w-6" /></Button>
                              <Button onClick={() => setEditingProduct(null)} variant="ghost" className="text-red-500 font-black hover:bg-red-500/10"><XCircle className="h-6 w-6" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(p)} className="text-zinc-400 hover:text-orange-500 h-10 w-10"><Edit className="h-5 w-5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-zinc-400 hover:text-red-500 h-10 w-10"><Trash2 className="h-5 w-5" /></Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Support <span className="text-orange-600">Central</span></h2>
                  <Badge className="bg-zinc-800 text-zinc-400 font-bold uppercase">{filteredSupport.length} ACTIVE THREADS</Badge>
                </div>
                <div className="grid gap-6">
                  {filteredSupport.length === 0 && <p className="text-zinc-600 italic">No support messages found.</p>}
                  {filteredSupport.map(m => (
                    <Card key={m.userId} className="border-zinc-800 bg-zinc-900/40">
                      <CardHeader className="border-b border-zinc-800/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-white uppercase font-black tracking-tighter">{m.userName || m.userEmail || 'Guest'}</CardTitle>
                            <CardDescription className="text-zinc-500 font-bold lowercase">{m.userEmail}</CardDescription>
                          </div>
                          <Badge variant="outline" className="border-zinc-800 text-[10px] uppercase font-black">{m.userId.slice(0, 8)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="h-64 overflow-y-auto p-6 space-y-3 bg-black/20">
                          {getThread(m.userId).map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-xl max-w-[80%] ${msg.type === 'admin' ? 'bg-orange-600 text-black font-bold' : 'bg-zinc-800 text-white'}`}>
                                <p className="text-xs">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex gap-2">
                          <Input 
                            placeholder="Type a reply..." 
                            className="bg-black border-zinc-800"
                            value={replyText[m.userId] || ''}
                            onChange={(e) => setReplyText({...replyText, [m.userId]: e.target.value})}
                            onKeyPress={(e) => e.key === 'Enter' && sendReply(m.userId)}
                          />
                          <Button size="sm" onClick={() => sendReply(m.userId)} className="bg-orange-600 text-black font-black uppercase text-xs px-6">REPLY</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'notes' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Public <span className="text-orange-600">Notes</span></h2>
                    <Button onClick={() => setShowAddNote(!showAddNote)} className="bg-orange-600 text-black font-black">
                      {showAddNote ? 'CANCEL' : 'ADD NEW NOTE'}
                    </Button>
                  </div>

                  <Card className="border-zinc-800 bg-zinc-900/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">Shop Availability Status</h3>
                      <p className="text-xs text-zinc-500 font-bold uppercase italic mt-1">When closed, users can browse but cannot transmit purchase orders.</p>
                    </div>
                    <Button 
                      onClick={() => updateDoc(doc(db, 'settings', 'shop'), { isOpen: !shopStatus.isOpen })}
                      className={`h-14 px-10 font-black uppercase tracking-widest transition-all rounded-xl ${
                        shopStatus.isOpen ? 'bg-green-600 text-black shadow-lg shadow-green-600/20' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      }`}
                    >
                      {shopStatus.isOpen ? 'SYSTEM ONLINE (OPEN)' : 'SYSTEM OFFLINE (CLOSED)'}
                    </Button>
                  </Card>

                  {showAddNote && (
                    <Card className="border-orange-600/20 bg-zinc-900 p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <select 
                            value={newNote.type} 
                            onChange={e => setNewNote({...newNote, type: e.target.value})}
                            className="bg-black border border-zinc-800 rounded-md h-10 px-3 text-white uppercase font-black text-xs"
                          >
                            <option value="text">TEXT ONLY</option>
                            <option value="image">IMAGE + TEXT</option>
                            <option value="video">VIDEO + TEXT</option>
                          </select>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Media URL (Image/Video)" 
                              value={newNote.mediaUrl} 
                              onChange={e => setNewNote({...newNote, mediaUrl: e.target.value})}
                              className="bg-black text-white" 
                            />
                            <div className="flex gap-1">
                              <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => setShowGalleryPicker(showGalleryPicker === 'note' ? null : 'note')}
                                className={`border-zinc-800 hover:border-orange-600 hover:bg-orange-600/10 h-10 w-10 p-0 shrink-0 ${showGalleryPicker === 'note' ? 'text-orange-600 bg-orange-600/10' : 'text-zinc-400'}`}
                                title="Choose from Gallery"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <label className="cursor-pointer">
                                <Input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*,video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, 'note');
                                  }}
                                />
                                <div className="border border-zinc-800 hover:border-orange-600 hover:bg-orange-600/10 h-10 w-10 p-0 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-orange-600 transition-colors">
                                  <Plus className="h-4 w-4" />
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {showGalleryPicker === 'note' && (
                          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 border border-zinc-800 p-3 rounded-xl bg-black/40 max-h-48 overflow-y-auto">
                            {gallery.map((url, i) => (
                              <button 
                                key={url + i} 
                                type="button"
                                onClick={() => {
                                  setNewNote({...newNote, mediaUrl: url, type: getMediaType(url)});
                                  setShowGalleryPicker(null);
                                }}
                                className="aspect-square rounded-lg overflow-hidden border border-transparent hover:border-orange-600 transition-all group"
                              >
                                {getMediaType(url) === 'video' ? (
                                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <Video className="h-6 w-6 text-orange-600" />
                                  </div>
                                ) : (
                                  <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                                )}
                              </button>
                            ))}
                            {gallery.length === 0 && <p className="col-span-full text-[10px] text-zinc-600 uppercase font-black py-4 text-center">Gallery is Empty</p>}
                          </div>
                        )}
                        <Input 
                          placeholder="Note Content..." 
                          value={newNote.content} 
                          onChange={e => setNewNote({...newNote, content: e.target.value})}
                          className="bg-black h-24 text-white" 
                        />
                        <Button onClick={handleAddNote} className="w-full bg-orange-600 text-black font-black uppercase">Publish Note</Button>
                      </div>
                    </Card>
                  )}

                  <div className="grid gap-4">
                    {notes.map(note => (
                      <Card key={note.id} className="border-zinc-800 bg-zinc-900/40 p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-4">
                            {note.content && <p className="text-sm text-white">{note.content}</p>}
                            {note.mediaUrl && (
                               <div className="w-full">
                                 {note.type === 'image' ? (
                                   <img src={note.mediaUrl} className="max-h-64 rounded-xl object-contain" referrerPolicy="no-referrer" />
                                 ) : note.type === 'video' ? (
                                   <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden bg-black">
                                     {note.mediaUrl.includes('youtube.com') || note.mediaUrl.includes('youtu.be') ? (
                                       <iframe 
                                         src={note.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                         className="w-full h-full" 
                                         frameBorder="0" 
                                         allowFullScreen 
                                       />
                                     ) : (
                                       <video 
                                         src={note.mediaUrl} 
                                         controls 
                                         className="w-full h-full object-contain cursor-pointer" 
                                         onClick={(e) => {
                                           if (e.currentTarget.paused) e.currentTarget.play();
                                           else e.currentTarget.pause();
                                         }}
                                       />
                                     )}
                                   </div>
                                 ) : null}
                               </div>
                            )}
                          </div>
                          <Button variant="ghost" onClick={() => deleteNote(note.id)} className="text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [shopStatus, setShopStatus] = useState({ isOpen: true });

  // Shop status listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'shop'), (snap) => {
      if (snap.exists()) {
        setShopStatus(snap.data() as { isOpen: boolean });
      } else {
        // Only admins should try to initialize settings
        if (user && authAdminEmails.includes(user.email || '')) {
           setDoc(doc(db, 'settings', 'shop'), { isOpen: true }).catch(err => {
             console.error("Failed to initialize shop status:", err);
           });
        }
      }
    }, (error) => {
      console.error("Shop Status Snapshot Error:", error);
    });
    return () => unsub();
  }, [user]);

  // User notification listener
  const prevNotifCount = useRef<number | null>(null);
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
        setMyNotifications(notifs);
        
        if (prevNotifCount.current !== null && notifs.length > prevNotifCount.current) {
          const latest = notifs[0] as any;
          if (!latest.read) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(() => {});
            if (Notification.permission === 'granted') {
              new Notification("System Update", {
                body: latest.message,
                icon: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/flame.svg"
              });
            }
          }
        }
        prevNotifCount.current = notifs.length;
      }, (error) => {
        console.error("Notifications Snapshot Error:", error);
      });
    }
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
          setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastLogin: serverTimestamp(),
            role: authAdminEmails.includes(u.email || '') ? 'admin' : 'user'
          }, { merge: true });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || !loaderComplete) {
    return (
      <ProfessionalLoader onComplete={() => setLoaderComplete(true)} />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-black font-sans antialiased selection:bg-orange-600 selection:text-black overflow-x-hidden">
        <NotificationPrompt />
        <ScrollIndicator />
        
        {/* Silly Orange Moving Glow */}
        <motion.div 
          animate={{ 
            x: [0, 100, -100, 0],
            y: [0, 50, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="fixed top-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none z-0"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 100, 0],
            y: [0, -50, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="fixed bottom-1/4 -right-20 h-[500px] w-[500px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none z-0"
        />

        <Navbar user={user} notifications={myNotifications} />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home user={user} shopStatus={shopStatus} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/admin" element={<Admin user={user} shopStatus={shopStatus} />} />
            <Route path="/support" element={<UserSupport user={user} />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
          </Routes>
        </AnimatePresence>
        <Toaster position="bottom-right" theme="dark" />
        
        <footer className="border-t border-orange-500/10 bg-black py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
              <Link to="/" className="flex items-center gap-2">
                <Logo className="h-10 w-10" />
                <span className="text-2xl font-black text-white uppercase italic">EVEN<span className="text-orange-600">SHOP</span></span>
              </Link>
              <div className="flex flex-col items-center gap-4 md:items-end">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-600">© 2026 EVEN SHOP BD. Elite Survival Marketplace.</p>
                <div className="flex gap-8">
                  <Link to="/terms" className="text-xs font-black uppercase text-zinc-500 hover:text-orange-600">Terms</Link>
                  <Link to="/privacy" className="text-xs font-black uppercase text-zinc-500 hover:text-orange-600">Privacy</Link>
                  <Link to="/support" className="text-xs font-black uppercase text-zinc-500 hover:text-orange-600">Support</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
