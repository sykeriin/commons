import React from 'react';
import { Bell, Menu, User as UserIcon } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface TopAppBarProps {
  user: FirebaseUser | null;
  onLogout: () => void;
  onProfileClick: () => void;
  onNotificationClick: () => void;
  onMenuClick: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  onProfileClick,
  onNotificationClick,
  onMenuClick,
}) => {
  return (
    <header className="fixed top-0 z-[60] w-full border-b-[3px] border-ink bg-surface-container-lowest/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="rounded-full p-2 transition-all hover:-rotate-6 hover:bg-tertiary-container">
            <Menu size={20} />
          </button>
          <h1 className="font-headline text-xl font-black uppercase tracking-tighter italic text-on-surface md:text-2xl">
            <span className="text-primary">COMMONS</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNotificationClick}
            className="relative rounded-full p-2 transition-all hover:rotate-6 hover:bg-primary-container"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-surface-container-lowest bg-primary" />
          </button>
          <button
            onClick={onProfileClick}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[2px] border-ink bg-surface-container-lowest shadow-[3px_3px_0px_0px_var(--color-ink)]"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon size={16} />
            )}
          </button>
        </div>
      </div>
      <div className="h-1.5 w-full bg-ink" />
    </header>
  );
};
