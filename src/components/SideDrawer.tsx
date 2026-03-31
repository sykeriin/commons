import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Compass, Calendar, Users, User, LogOut, Info, Shield } from 'lucide-react';
import { Button } from './Button';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose, onNavigate, onLogout }) => {
  const menuItems = [
    { id: 'home', label: 'DASHBOARD', icon: <Home size={20} /> },
    { id: 'discover', label: 'EXPLORE', icon: <Compass size={20} /> },
    { id: 'events', label: 'EVENTS', icon: <Calendar size={20} /> },
    { id: 'clubs', label: 'CLUBS', icon: <Users size={20} /> },
    { id: 'profile', label: 'MY PROFILE', icon: <User size={20} /> },
  ];

  const secondaryItems = [
    { id: 'about', label: 'ABOUT COMMONS', icon: <Info size={20} /> },
    { id: 'privacy', label: 'PRIVACY', icon: <Shield size={20} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-surface-container-lowest border-r-4 border-ink z-[101] flex flex-col"
          >
            <div className="p-6 border-b-2 border-ink flex items-center justify-between bg-primary">
              <h2 className="font-headline font-black text-2xl text-on-primary uppercase tracking-tighter italic">
                COMMONS
              </h2>
              <button 
                onClick={onClose}
                className="text-on-primary p-1 hover:bg-on-primary/10 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-1">
                <p className="font-headline font-black text-[10px] text-on-surface-variant uppercase tracking-widest px-2 mb-2">
                  NAVIGATION
                </p>
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl font-headline font-black text-sm uppercase tracking-tight hover:bg-primary-container hover:text-on-primary-container transition-all group"
                  >
                    <span className="text-primary group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <p className="font-headline font-black text-[10px] text-on-surface-variant uppercase tracking-widest px-2 mb-2">
                  SYSTEM
                </p>
                {secondaryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl font-headline font-black text-sm uppercase tracking-tight hover:bg-surface-container transition-all opacity-60 hover:opacity-100"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t-2 border-ink bg-surface-container">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 rounded-xl"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                <LogOut size={20} />
                LOGOUT
              </Button>
              <p className="mt-4 text-center font-body text-[10px] font-bold opacity-40 uppercase tracking-widest">
                COMMONS V1.0.4 • 2026
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
