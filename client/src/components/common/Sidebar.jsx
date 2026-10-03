import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { 
  LayoutDashboard, 
  Compass, 
  Users, 
  MessageSquare, 
  Calendar, 
  UserCheck, 
  Award,
  Video,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentTab, onNavigate }) {
  const { currentUser, logout } = useAuth();
  const { requests, sessions } = useSync();

  const pendingCount = requests.filter(r => r.receiverId === currentUser?.uid && r.status === 'pending').length;
  const upcomingCount = sessions.filter(s => s.status === 'scheduled').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Skills', icon: Compass },
    { id: 'connections', label: 'Connections', icon: Users, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'sessions', label: 'Live Sessions', icon: Calendar, badge: upcomingCount > 0 ? upcomingCount : null },
    { id: 'my-profile', label: 'My Profile', icon: UserCheck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between py-6 px-4 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Skill Exchange
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-brand-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Meet Quick Status card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-brand-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Real Google Meet</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All sessions create genuine Google Meet links that you and your peer can join simultaneously.
          </p>
        </div>
      </div>

      {/* Bottom Profile Summary & Credits Card */}
      <div className="space-y-3">
        {/* Credits Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Learning Credits</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black">{currentUser?.credits || 50}</span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
            <span>Teach: <strong className="text-emerald-400">+20</strong></span>
            <span>Learn: <strong className="text-brand-300">+10</strong></span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); onNavigate('landing'); }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}
