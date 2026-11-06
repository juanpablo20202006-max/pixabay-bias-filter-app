'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Database, History, Terminal } from 'lucide-react';

interface HeaderProps {
  filterActive: boolean;
  onToggleFilter: () => void;
  mongoConnected: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filterActive,
  onToggleFilter,
  mongoConnected,
  historyCount,
  onOpenHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 glass-panel shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Technical Identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider text-white uppercase flex items-center gap-2">
                <span>ANTIGRAVITY</span>
                <span className="text-teal-400 font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/30">
                  CORE v3.0
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>Pixabay API</span>
              <span className="text-slate-600">&bull;</span>
              <span>MongoDB 7 NoSQL</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-teal-400/90">Algorithmic Bias Guard</span>
            </p>
          </div>
        </div>

        {/* System Telemetry & Status Badges */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* MongoDB Docker telemetry badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono glass-panel border-white/5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">MONGO:</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${mongoConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <strong className={mongoConnected ? 'text-emerald-300 font-semibold' : 'text-rose-400'}>
                {mongoConnected ? 'DOCKER:27017' : 'OFFLINE'}
              </strong>
            </span>
          </div>

          {/* History / Audit Log Trigger */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono glass-panel hover:bg-slate-800/80 text-slate-300 border-white/5 hover:border-teal-500/40 transition active:scale-95"
            title="Abrir consola de auditoría de MongoDB"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>AUDITORÍA ({historyCount})</span>
          </button>

          {/* Antisesgo Toggle */}
          <button
            onClick={onToggleFilter}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition border shadow-lg active:scale-95 ${
              filterActive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80 shadow-emerald-950/50'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/80 shadow-amber-950/50'
            }`}
          >
            {filterActive ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>FILTRO: ACTIVO</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>FILTRO: INACTIVO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
