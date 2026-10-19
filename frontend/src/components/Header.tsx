import React, { useEffect, useState } from 'react';
import { Menu, ShieldCheck, AlertTriangle, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkSystemHealth } from '../api/health';
import { SystemHealth } from '../types/production';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'Automotive Plant Operations & Telemetry',
  onOpenMobileMenu,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await checkSystemHealth();
        if (isMounted) setHealth(res);
      } catch (err) {
        if (isMounted) {
          setHealth({
            status: 'DEGRADED',
            database: 'DISCONNECTED',
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700">
            Admin
          </span>
        );
      case 'OPERATOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-700">
            Operator
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700">
            Viewer
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Hamburger button + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right side: Telemetry & User Account Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend & DB Health Badge */}
        {health?.database === 'CONNECTED' ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline">MySQL Telemetry:</span>
            <span>Online</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 hidden lg:inline" />
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="hidden md:inline">Telemetry:</span>
            <span>Connecting...</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 hidden lg:inline" />
          </div>
        )}

        {/* User Info & Role Badge */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                </span>
                {getRoleBadge(user.role)}
              </div>
              <span className="text-[11px] text-slate-400 leading-none mt-0.5">
                {user.email}
              </span>
            </div>
            {/* Mobile badge */}
            <div className="md:hidden">
              {getRoleBadge(user.role)}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
