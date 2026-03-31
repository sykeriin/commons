/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, signIn, logout } from '@/src/lib/firebase';
import { syncUser, getUserData, completeCommonsSelection, setUserRole } from '@/src/services/firebaseService';
import { seedDatabase } from '@/src/services/seedService';
import { LandingView } from './views/LandingView';
import { CommonsSelectionView } from './views/CommonsSelectionView';
import { RoleSelectionView } from './views/RoleSelectionView';
import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { ProfileView } from './views/ProfileView';
import { EventsView } from './views/EventsView';
import { ClubsView } from './views/ClubsView';
import { ClubRegistrationView } from './views/ClubRegistrationView';
import { ClubManagementView } from './views/ClubManagementView';
import { DetailsView } from './views/DetailsView';
import { ScheduleView } from './views/ScheduleView';
import { NotificationsView } from './views/NotificationsView';
import { EditProfileView } from './views/EditProfileView';
import { AboutCommonsView } from './views/AboutCommonsView';
import { PrivacyView } from './views/PrivacyView';
import { LoadingScreen } from './components/LoadingScreen';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { SideDrawer } from './components/SideDrawer';
import { updateProfile } from 'firebase/auth';
import { db } from '@/src/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <h1 className="font-headline font-black text-4xl uppercase mb-4 text-primary">Something went wrong</h1>
          <p className="font-body text-on-surface-variant mb-8 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-on-primary font-headline font-black rounded-xl border-4 border-ink neo-shadow-sm"
          >
            RELOAD APP
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type ViewState = 'landing' | 'role-selection' | 'registration' | 'main' | 'club-management' | 'details' | 'schedule' | 'notifications' | 'edit-profile' | 'commons-selection' | 'about' | 'privacy';
type UserRole = 'student' | 'club' | 'coordinator';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState('home');
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<{ type: 'club' | 'event'; data: any } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUser(firebaseUser);
        await seedDatabase(firebaseUser.uid);
        
        getUserData(firebaseUser.uid, (data) => {
          setUserData(data);
          const nextRole = data?.role as UserRole | undefined;
          if (!nextRole) {
            setView('role-selection');
          } else if (nextRole === 'student' && !data?.hasSelectedCommons) {
            setView('commons-selection');
          } else if (nextRole === 'club' && !data?.clubOnboarded) {
            setView('registration');
          } else {
            setView('main');
          }
          setRole(nextRole ?? null);
          setLoading(false);
        });
        
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setView(previewMode ? 'role-selection' : 'landing');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [previewMode]);

  const handleStart = async () => {
    try {
      await signIn();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Sign in failed:", error);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          setPreviewMode(true);
          setView('role-selection');
        }
      }
    }
  };
  
  const handleRoleSelect = async (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (user) {
      await setUserRole(user.uid, selectedRole);
    }
    if (selectedRole === 'student') {
      setView(userData?.hasSelectedCommons ? 'main' : 'commons-selection');
      return;
    }
    if (selectedRole === 'club') {
      setView('registration');
    } else {
      setView('main');
    }
  };

  const handleRegistrationComplete = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        clubOnboarded: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    setView('main');
  };

  const handleManageClub = (club: any) => {
    setSelectedClub(club);
    setView('club-management');
  };

  const handleShowDetails = (type: 'club' | 'event', data: any) => {
    setDetailsData({ type, data });
    setView('details');
  };

  const handleDrawerNavigate = (destination: string) => {
    if (destination === 'about' || destination === 'privacy') {
      setView(destination);
      return;
    }
    setActiveTab(destination);
    setView('main');
  };

  const handleSaveProfile = async (data: any) => {
    if (!user && previewMode) {
      setUserData((current: any) => ({
        ...current,
        displayName: data.displayName,
        major: data.major,
        year: data.year,
        bio: data.bio,
      }));
      setView('main');
      setActiveTab('profile');
      return;
    }
    if (!user) return;
    try {
      await updateProfile(user, { displayName: data.displayName });
      await setDoc(doc(db, 'users', user.uid), {
        major: data.major,
        year: data.year,
        bio: data.bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setView('main');
      setActiveTab('profile');
    } catch (error) {
      console.error("Save profile failed:", error);
    }
  };

  const handleCompleteCommons = async (selected: string[]) => {
    if (user) {
      await completeCommonsSelection(user.uid, selected);
      setView('main');
    } else if (previewMode) {
      setUserData((current: any) => ({
        ...current,
        hasSelectedCommons: true,
        selectedCommons: selected,
      }));
      setView('main');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <LandingView
                onStart={handleStart}
                onPreview={() => {
                  setPreviewMode(true);
                  setUserData((current: any) => current ?? {
                    displayName: 'Demo Student',
                    major: 'Campus Culture',
                    graduationYear: '2027',
                    selectedCommons: ['innovation', 'creative', 'vibes'],
                    hasSelectedCommons: true,
                  });
                  setView('role-selection');
                }}
              />
            </motion.div>
          )}

          {view === 'role-selection' && (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <RoleSelectionView onSelect={handleRoleSelect} />
            </motion.div>
          )}

          {view === 'registration' && (
            <motion.div
              key="registration"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <ClubRegistrationView 
                user={user}
                onComplete={handleRegistrationComplete} 
                onCancel={() => setView('main')}
              />
            </motion.div>
          )}

          {view === 'club-management' && (
            <motion.div
              key="club-management"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
            >
              <ClubManagementView 
                club={selectedClub} 
                user={user} 
                onBack={() => setView('main')} 
              />
            </motion.div>
          )}

          {view === 'details' && detailsData && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <DetailsView 
                type={detailsData.type} 
                data={detailsData.data} 
                user={user} 
                onBack={() => setView('main')} 
              />
            </motion.div>
          )}

          {view === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
            >
              <ScheduleView onBack={() => setView('main')} />
            </motion.div>
          )}

          {view === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <NotificationsView onBack={() => setView('main')} />
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
            >
              <AboutCommonsView onBack={() => setView('main')} />
            </motion.div>
          )}

          {view === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
            >
              <PrivacyView onBack={() => setView('main')} />
            </motion.div>
          )}

          {view === 'edit-profile' && (
            <motion.div
              key="edit-profile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
            >
              <EditProfileView 
                user={user} 
                onBack={() => setView('main')} 
                onSave={handleSaveProfile} 
              />
            </motion.div>
          )}

          {view === 'commons-selection' && (
            <motion.div
              key="commons-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-50"
            >
              <CommonsSelectionView onComplete={handleCompleteCommons} />
            </motion.div>
          )}

          {view === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <SideDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                onNavigate={handleDrawerNavigate}
                onLogout={logout}
              />
              <TopAppBar 
                user={user} 
                onLogout={logout} 
                onProfileClick={() => setActiveTab('profile')}
                onNotificationClick={() => setView('notifications')}
                onMenuClick={() => setIsDrawerOpen(true)}
              />
              
              <main className="min-h-screen">
                {activeTab === 'home' && (
                  <HomeView 
                    user={user} 
                    onShowDetails={handleShowDetails} 
                    onViewSchedule={() => setView('schedule')}
                    onTabChange={setActiveTab}
                  />
                )}
                {activeTab === 'discover' && <DiscoverView user={user} onStartClub={() => setView('registration')} onShowDetails={handleShowDetails} />}
                {activeTab === 'profile' && (
                  <ProfileView 
                    user={user} 
                    onManageClub={handleManageClub} 
                    onShowDetails={handleShowDetails} 
                    onEditProfile={() => setView('edit-profile')}
                  />
                )}
                {activeTab === 'events' && <EventsView user={user} onShowDetails={handleShowDetails} />}
                {activeTab === 'clubs' && <ClubsView user={user} onStartClub={() => setView('registration')} onManageClub={handleManageClub} onShowDetails={handleShowDetails} />}
              </main>

              <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
