import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { 
  Sparkles, 
  Search, 
  Bell, 
  Calendar, 
  MessageSquare, 
  User, 
  LogOut, 
  ExternalLink,
  ChevronDown,
  Layers,
  Settings,
  LogIn
} from 'lucide-react';

export default function Navbar({ onNavigate, currentTab, onOpenAuth }) {
  const { currentUser, logout } = useAuth();
  const { notifications, requests, markNotificationsAsRead } = useSync();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userNotifs = notifications.filter(n => n.userId === currentUser?.uid);
  const unreadNotifs = userNotifs.filter(n => !n.read);
  const pendingRequests = requests.filter(r => r.receiverId === currentUser?.uid && r.status === 'pending');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('discover', { query: searchQuery.trim() });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Skill<span className="text-brand-600">Sync</span></span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wider">MVP</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">Learn • Teach • Grow Together</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills (Python, UI/UX, Java...), students, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </form>

        {/* Right Navigation & Authenticated User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {currentUser ? (
            <>
              {/* Requests Icon */}
              <button
                onClick={() => onNavigate('connections')}
                className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  currentTab === 'connections' ? 'bg-slate-100 text-brand-600 font-bold' : ''
                }`}
                title="Connection Requests"
              >
                <MessageSquare className="w-5 h-5" />
                {pendingRequests.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                    if (!showNotifications && unreadNotifs.length > 0) {
                      markNotificationsAsRead();
                    }
                  }}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadNotifs.length > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-full">
                            {unreadNotifs.length} new
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={markNotificationsAsRead}
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
                      {userNotifs.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        userNotifs.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotifications(false);
                              if (n.link?.startsWith('/chat')) {
                                const connId = n.link.replace('/chat/', '');
                                onNavigate('chat', { connectionId: connId });
                              } else if (n.link === '/sessions') {
                                onNavigate('sessions');
                              } else if (n.link === '/connections') {
                                onNavigate('connections');
                              }
                            }}
                            className={`p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors ${
                              !n.read ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Real Authenticated User Profile Menu: [Photo] [Name] ▼ */}
              <div className="relative">
                <button
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all text-slate-800"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                      alt={currentUser?.name}
                      className="w-7 h-7 rounded-full object-cover ring-1.5 ring-brand-500"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] hidden sm:inline">
                    {currentUser?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-3">
                      <img src={currentUser?.photoURL} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-slate-900 truncate">{currentUser?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser?.college || 'Verified Student'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            ⭐ {currentUser?.rating?.toFixed(1) || '5.0'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {currentUser?.credits || 50} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { onNavigate('my-profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </button>
                      <button
                        onClick={() => { onNavigate('onboarding'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <Layers className="w-4 h-4 text-slate-400" />
                        Edit Skills & Availability
                      </button>
                      <button
                        onClick={() => { onNavigate('my-profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>
                      <button
                        onClick={() => { onNavigate('landing'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        Landing Page
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); onNavigate('landing'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth ? onOpenAuth('login') : onNavigate('landing')}
                className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : onNavigate('landing')}
                className="py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Get Started</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
