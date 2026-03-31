import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Heart, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Card } from '@/src/components/Card';

interface NotificationsViewProps {
  onBack: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const notifications = [
    { id: '1', title: 'Campus Hackathon', message: 'Registration closes in 2 hours. Your crew still has spots.', icon: <Zap size={18} />, tone: 'bg-primary-container' },
    { id: '2', title: 'Robotics Club', message: 'A new build-night announcement just dropped.', icon: <MessageSquare size={18} />, tone: 'bg-secondary-container' },
    { id: '3', title: 'Profile Buzz', message: 'Your recent club post picked up new reactions.', icon: <Heart size={18} />, tone: 'bg-tertiary-container' },
    { id: '4', title: 'Badge Unlocked', message: 'You earned Early Bird for jumping into events fast.', icon: <Sparkles size={18} />, tone: 'bg-[#ffe9df]' },
  ];

  return (
    <div className="screen-shell mx-auto max-w-4xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.18em]">
        <ArrowLeft size={18} /> BACK
      </button>

      <section className="editorial-frame interactive-grid relative overflow-hidden bg-secondary-container p-6 md:p-8">
        <div className="floating-orb right-8 top-8 h-16 w-16 bg-tertiary-container" />
        <div className="floating-orb bottom-8 left-10 h-12 w-12 bg-primary-container" />
        <div className="relative z-10 max-w-3xl pr-24 md:pr-28">
        <span className="sticker-badge bg-ink text-white">LIVE INBOX</span>
        <h1 className="mt-5 font-headline text-5xl font-black uppercase leading-[0.84] tracking-tighter md:text-7xl">
          WHAT'S <span className="italic text-primary">NEW</span>
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-on-secondary-container">
          Alerts, club buzz, and event momentum all land here. This view should feel loud, clear, and impossible to miss.
        </p>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {notifications.map((notif, i) => (
          <motion.div key={notif.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`p-5 ${notif.tone}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[3px] border-ink bg-white">
                  {notif.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-headline text-2xl font-black uppercase tracking-tighter">{notif.title}</h2>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">2H AGO</span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface/80">{notif.message}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Bell size={46} className="mx-auto mb-3 text-primary" />
        <p className="font-headline text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">YOU'RE CAUGHT UP FOR NOW</p>
      </div>
    </div>
  );
};
