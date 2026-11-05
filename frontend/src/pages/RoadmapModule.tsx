import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, BarChart3, Users, Settings as SettingsIcon } from 'lucide-react';

interface RoadmapModuleProps {
  moduleName: string;
  description: string;
  features: string[];
  type: 'analytics' | 'users' | 'settings';
}

export const RoadmapModule: React.FC<RoadmapModuleProps> = ({
  moduleName,
  description,
  features,
  type,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'analytics':
        return <BarChart3 className="w-8 h-8 text-blue-600" />;
      case 'users':
        return <Users className="w-8 h-8 text-indigo-600" />;
      case 'settings':
      default:
        return <SettingsIcon className="w-8 h-8 text-slate-700" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
          {getIcon()}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Enterprise Roadmap Module</span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{moduleName}</h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
          {description}
        </p>

        <div className="mt-8 pt-8 border-t border-slate-100 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Planned Technical Capabilities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>AutoTrack Enterprise v2.4</span>
          <span className="flex items-center gap-1 text-blue-600 font-medium">
            <span>Core Telemetry & Analytics Active</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
