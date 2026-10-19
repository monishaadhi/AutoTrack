import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  AlertTriangle,
  Factory,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/lines',
      label: 'Production Lines',
      icon: Cpu,
    },
    {
      to: '/production',
      label: 'Production Records',
      icon: ClipboardList,
    },
    {
      to: '/quality',
      label: 'Quality Issues',
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">AutoTrack</span>
                <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">
                  Manufacturing Ops
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

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Plant Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs text-slate-400">
            <div className="font-medium text-slate-300">Connected Hub</div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              autotrack_db (MySQL 8+)
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
