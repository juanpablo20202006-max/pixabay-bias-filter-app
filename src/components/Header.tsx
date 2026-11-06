'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Database } from 'lucide-react';

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Taller Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Pixabay + Anti-Bias Engine
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Taller Práctico
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Consumo de API Pixabay &bull; Persistencia NoSQL MongoDB &bull; Mitigación de Sesgos
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* MongoDB Connection Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>MongoDB:</span>
            <span className={`inline-block w-2 h-2 rounded-full ${mongoConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-800">{mongoConnected ? 'Conectado (Docker 7)' : 'Desconectado'}</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-white hover:bg-slate-50 text-slate-700 border-slate-200 transition"
            title="Ver auditoría del historial de búsquedas"
          >
            <span>Historial ({historyCount})</span>
          </button>

          {/* Antisesgo Toggle / Badge as shown in Mockup */}
          <button
            onClick={onToggleFilter}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm ${
              filterActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {filterActive ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Filtro Antisesgo: ACTIVO</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Filtro Antisesgo: INACTIVO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
