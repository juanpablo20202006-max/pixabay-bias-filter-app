'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Info,
  UserX,
  SlidersHorizontal,
  Flame,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { BiasAnalysisResult, BlacklistFilterInfo } from '@/types';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  filterActive: boolean;
  biasAnalysis: BiasAnalysisResult | null;
  currentQuery: string;
  blacklistActive: boolean;
  onToggleBlacklist: () => void;
  blacklistInfo: BlacklistFilterInfo | null;
}

const ACADEMIC_KEYWORDS = ['BLACK', 'POOR', 'NATURE', 'TECHNOLOGY'];
const GEOGRAPHIC_KEYWORDS = ['NIGERIA', 'PERU'];

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  isLoading,
  filterActive,
  biasAnalysis,
  currentQuery,
  blacklistActive,
  onToggleBlacklist,
  blacklistInfo,
}) => {
  const [inputVal, setInputVal] = useState(currentQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleChipClick = (keyword: string) => {
    setInputVal(keyword);
    onSearch(keyword);
  };

  return (
    <section className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-7 mb-8 shadow-2xl relative overflow-hidden transition">
      {/* Background ambient glow accent */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Console Header Bar */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-white/5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
              CONSOLA DE BÚSQUEDA // FILTRO ALGORÍTMICO
            </span>
            <span className="block text-[10px] text-slate-500 font-mono">MITIGACIÓN DE SESGOS Y PURGA DE ESTEREOTIPOS</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Blacklist toggle button */}
          <button
            type="button"
            onClick={onToggleBlacklist}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border active:scale-95 ${
              blacklistActive
                ? 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/50 hover:bg-rose-900/80'
                : 'bg-slate-900/70 text-slate-400 border-white/10 hover:bg-slate-800'
            }`}
            title="Activar/Desactivar eliminación automática de humanos y rostros mediante blacklist"
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>BLACKLIST PERSONAS: {blacklistActive ? 'ON (PURGA ACTIVA)' : 'OFF'}</span>
          </button>

          {/* Antisesgo badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
              filterActive
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
            }`}
          >
            {filterActive ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GUARDIA ÉTICA: ACTIVA</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>GUARDIA ÉTICA: INACTIVA</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Search Command Bar */}
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4 text-teal-400" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder='Escribe palabra clave (ej: "nigeria", "peru", "black", "poor", "nature")...'
            className="w-full pl-11 pr-10 py-4 bg-slate-900/90 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-sm font-sans transition shadow-inner"
            disabled={isLoading}
          />

          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800/80 border border-white/10 transition"
            >
              ESC
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="px-7 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>CONSULTANDO...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>EJECUTAR BÚSQUEDA</span>
            </>
          )}
        </button>
      </form>

      {/* Categorized Test Chips Bar */}
      <div className="relative mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs">
        {/* Academic Keywords Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>TALLER:</span>
          </span>
          {ACADEMIC_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleChipClick(kw)}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-teal-500/20 hover:border-teal-500/40 border border-white/10 text-slate-200 font-mono text-xs transition active:scale-95"
            >
              "{kw}"
            </button>
          ))}
        </div>

        <div className="hidden sm:block w-px h-5 bg-white/10" />

        {/* Geographic No-Humans Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-teal-400" />
            <span>GEOGRÁFICAS (SIN PERSONAS):</span>
          </span>
          {GEOGRAPHIC_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleChipClick(kw)}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-indigo-500/20 hover:border-indigo-500/40 border border-white/10 text-indigo-200 font-mono text-xs transition active:scale-95"
            >
              "{kw}"
            </button>
          ))}
        </div>
      </div>

      {/* Blacklist Removal Notice Banner */}
      {blacklistInfo && blacklistInfo.enabled && blacklistInfo.filteredOutCount > 0 && (
        <div className="relative mt-4 p-4 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-3 backdrop-blur-md">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-300">
            <UserX className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap font-mono font-bold text-white">
              <span>PURGA ANTISESGO ACTIVADA</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[11px]">
                -{blacklistInfo.filteredOutCount} imágenes con personas / rostros eliminadas
              </span>
            </div>
            <p className="mt-1 text-purple-300 text-[11px]">
              Se excluyeron retratos, aglomeraciones y estereotipos demográficos para garantizar únicamente paisajes, naturaleza, símbolos y arquitectura.
            </p>
            {blacklistInfo.matchedTagsSample?.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-purple-400">Etiquetas interceptadas:</span>
                {blacklistInfo.matchedTagsSample.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-purple-300 border border-purple-500/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Algorithmic Bias Telemetry HUD Banner */}
      {biasAnalysis && (
        <div
          className={`relative mt-4 p-4 rounded-xl border text-xs transition backdrop-blur-md ${
            biasAnalysis.classification === 'BLOQUEADO'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : biasAnalysis.classification === 'ADVERTENCIA'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5">
              {biasAnalysis.classification === 'BLOQUEADO' ? (
                <XCircle className="w-5 h-5 text-rose-400" />
              ) : biasAnalysis.classification === 'ADVERTENCIA' ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                    biasAnalysis.classification === 'BLOQUEADO'
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                      : biasAnalysis.classification === 'ADVERTENCIA'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                  }`}
                >
                  ESTADO: {biasAnalysis.classification}
                </span>

                <span className="text-[11px] opacity-80 font-mono">
                  ÍNDICE DE RIESGO: {(biasAnalysis.riskScore * 100).toFixed(0)}%
                </span>

                {biasAnalysis.matchedCategories?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 font-mono"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <p className="text-slate-200 font-sans text-xs sm:text-sm font-medium">
                {biasAnalysis.reason}
              </p>

              {biasAnalysis.suggestedAction && (
                <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-1 font-mono">
                  <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{biasAnalysis.suggestedAction}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
