import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  AlertTriangle,
  Factory,
  Layers,
  Wrench,
  BarChart3,
  Users,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const primaryNavItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/production',
      label: 'Production Records',
      icon: ClipboardList,
    },
    {
      to: '/lines',
      label: 'Production Lines',
      icon: Cpu,
    },
    {
      to: '/quality',
      label: 'Quality Issues',
      icon: AlertTriangle,
    },
    {
      to: '/work-orders',
      label: 'Work Orders',
      icon: Layers,
    },
    {
      to: '/equipment',
      label: 'Equipment Monitoring',
      icon: Wrench,
    },
  ];

  const plannedNavItems = [
    {
      to: '/analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      badge: 'Roadmap',
    },
    {
      to: '/users',
      label: 'User Management',
      icon: Users,
      badge: 'Roadmap',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: 'Roadmap',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto flex flex-col justify-between shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">AutoTrack</span>
                <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">
                  Automotive Ops
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Operations Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Modules
            </div>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}

            {/* Planned Modules */}
            <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Roadmap Modules
            </div>
            {plannedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Connected Hub</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
              autotrack_db (MySQL 9)
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
