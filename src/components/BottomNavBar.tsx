import React from 'react';
import { Calendar, Compass, Home, User, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex min-w-0 flex-col items-center justify-center rounded-full px-2 py-2 text-[10px] font-headline font-bold uppercase tracking-[0.14em] transition-all',
      active
        ? 'scale-110 bg-primary px-4 text-on-primary shadow-[3px_3px_0px_0px_var(--color-ink)]'
        : 'text-on-surface hover:-translate-y-1 hover:bg-tertiary-container'
    )}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

export const BottomNavBar: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="fixed bottom-5 left-1/2 z-50 flex h-[74px] w-[92%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border-[3px] border-ink bg-surface-container-lowest/85 px-3 backdrop-blur-2xl shadow-[0_20px_40px_rgba(45,47,47,0.16)]">
      <NavItem icon={<Home size={18} />} label="Home" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
      <NavItem icon={<Compass size={18} />} label="Discover" active={activeTab === 'discover'} onClick={() => onTabChange('discover')} />
      <NavItem icon={<User size={18} />} label="Profile" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
      <NavItem icon={<Calendar size={18} />} label="Events" active={activeTab === 'events'} onClick={() => onTabChange('events')} />
      <NavItem icon={<Users size={18} />} label="Clubs" active={activeTab === 'clubs'} onClick={() => onTabChange('clubs')} />
    </nav>
  );
};
