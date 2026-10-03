import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import AuthModal from './components/common/AuthModal';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import ConnectionsPage from './pages/ConnectionsPage';
import ChatPage from './pages/ChatPage';
import SessionsPage from './pages/SessionsPage';
import OnboardingPage from './pages/OnboardingPage';
import MyProfilePage from './pages/MyProfilePage';

// Mobile bottom navigation icons
import { LayoutDashboard, Compass, Users, MessageSquare, Calendar, UserCheck } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();

  // Navigation router state
  const [currentTab, setCurrentTab] = useState(() => {
    return 'landing';
  });

  const [navParams, setNavParams] = useState({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigate = (tab, params = {}) => {
    // Protected route check: if user is not logged in and attempts protected route, prompt login
    if (!currentUser && tab !== 'landing') {
      openAuth('login');
      return;
    }
    setCurrentTab(tab);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When user signs in, route them from landing directly to their dashboard
  useEffect(() => {
    if (currentUser && currentTab === 'landing') {
      setCurrentTab('dashboard');
    }
  }, [currentUser]);

  // When user logs out, return to landing
  useEffect(() => {
    if (!currentUser && currentTab !== 'landing' && !loading) {
      setCurrentTab('landing');
    }
  }, [currentUser, loading]);

  const isLanding = currentTab === 'landing';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* If Landing Page, show full landing without app layout */}
      {isLanding ? (
        <LandingPage onNavigate={handleNavigate} onOpenAuth={openAuth} />
      ) : (
        <>
          {/* Main App Top Navbar */}
          <Navbar 
            onNavigate={handleNavigate} 
            currentTab={currentTab} 
            onOpenAuth={openAuth}
          />

          {/* Body with Sidebar + Main Content */}
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            {/* Desktop Sidebar */}
            <Sidebar currentTab={currentTab} onNavigate={handleNavigate} />

            {/* Main Content Pane */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-x-hidden pb-24 lg:pb-8">
              {currentTab === 'dashboard' && (
                <DashboardPage onNavigate={handleNavigate} />
              )}
              {currentTab === 'discover' && (
                <DiscoverPage onNavigate={handleNavigate} initialQuery={navParams.query || ''} />
              )}
              {currentTab === 'profile' && (
                <ProfilePage userId={navParams.userId} onNavigate={handleNavigate} />
              )}
              {currentTab === 'connections' && (
                <ConnectionsPage onNavigate={handleNavigate} />
              )}
              {currentTab === 'chat' && (
                <ChatPage connectionId={navParams.connectionId} onNavigate={handleNavigate} />
              )}
              {currentTab === 'sessions' && (
                <SessionsPage initialSessionId={navParams.sessionId} onNavigate={handleNavigate} />
              )}
              {currentTab === 'onboarding' && (
                <OnboardingPage onNavigate={handleNavigate} />
              )}
              {currentTab === 'my-profile' && (
                <MyProfilePage onNavigate={handleNavigate} />
              )}
            </main>
          </div>

          {/* Mobile Bottom Navigation Bar (Hidden on lg screens) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around">
            {[
              { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
              { id: 'discover', label: 'Discover', icon: Compass },
              { id: 'connections', label: 'Network', icon: Users },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'sessions', label: 'Meet', icon: Calendar },
              { id: 'my-profile', label: 'Profile', icon: UserCheck },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span className="mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Global Real Authentication Modal (Google / Email Login / Signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          setCurrentTab('dashboard');
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </AuthProvider>
  );
}
