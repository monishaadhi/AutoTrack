import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageInfo = (pathname: string): { title: string; subtitle: string } => {
    switch (pathname) {
      case '/':
        return {
          title: 'Manufacturing Dashboard',
          subtitle: 'Live plant output, target achievement, and operational metrics',
        };
      case '/lines':
        return {
          title: 'Production Lines',
          subtitle: 'Facility status, robotic cell health, and line configuration',
        };
      case '/production':
        return {
          title: 'Shift Production Records',
          subtitle: 'Detailed throughput records, shift targets, and scrap tracking',
        };
      case '/quality':
        return {
          title: 'Quality & Defect Monitoring',
          subtitle: 'Inspection defect tracking, tolerance logs, and resolution workflow',
        };
      default:
        return {
          title: 'AutoTrack Dashboard',
          subtitle: 'Automotive Manufacturing Operations',
        };
    }
  };

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default App;
