'use client';

import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, ShieldCheck, ShieldAlert, XCircle, Info, UserX, CheckCircle } from 'lucide-react';
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

const TEST_KEYWORDS = ['BLACK', 'POOR', 'NIGERIA', 'PERU', 'NATURE', 'TECHNOLOGY'];

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
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7 mb-8 transition">
      {/* Component Title & Status Bar identical to Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-wide">
          <Search className="w-4 h-4 text-teal-600" />
          <span className="uppercase text-slate-700">COMPONENTE: BUSCADOR CON FILTRO ALGORÍTMICO</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Blacklist No-Humans / No-Afro-Stereotypes Filter Toggle */}
          <button
            type="button"
            onClick={onToggleBlacklist}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition ${
              blacklistActive
                ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Activar/Desactivar eliminación automática de personas y contenido afro mediante lista negra de etiquetas"
          >
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Blacklist Personas: {blacklistActive ? 'ACTIVA (Sin Humanos)' : 'INACTIVA'}</span>
          </button>

          {/* General Anti-bias Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${
              filterActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {filterActive ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Filtro Antisesgo: ACTIVO</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Filtro Antisesgo: INACTIVO</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder='Escribe palabra clave (ej: "nigeria", "peru", "black", "poor", "nature")...'
            className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 text-sm sm:text-base transition"
            disabled={isLoading}
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>[ Q Buscar ]</span>
            </>
          )}
        </button>
      </form>

      {/* Test Keywords Chips with Nigeria and Peru added */}
      <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500">Palabras clave de prueba:</span>
        {TEST_KEYWORDS.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => handleChipClick(kw)}
            className="px-3 py-1 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 font-mono text-xs font-semibold transition"
          >
            "{kw}"
          </button>
        ))}
      </div>

      {/* Dedicated Blacklist Humans Notice */}
      {blacklistInfo && blacklistInfo.enabled && blacklistInfo.filteredOutCount > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
          <UserX className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>Filtro de Exclusión de Personas (Blacklist) Aplicado:</span>
              <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {blacklistInfo.filteredOutCount} imágenes eliminadas
              </span>
            </div>
            <p className="mt-0.5 text-purple-800">
              Se han purgado de la galería todas las imágenes con seres humanos, rostros o contenido demográfico para evitar sesgos y estereotipos raciales.
              {blacklistInfo.matchedTagsSample?.length > 0 && (
                <span className="block mt-1 font-mono text-[11px] text-purple-700">
                  Etiquetas de personas bloqueadas: [{blacklistInfo.matchedTagsSample.join(', ')}]
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Bias Analysis Feedback Banner */}
      {biasAnalysis && (
        <div
          className={`mt-5 p-4 rounded-xl border text-xs sm:text-sm transition animate-in fade-in ${
            biasAnalysis.classification === 'BLOQUEADO'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : biasAnalysis.classification === 'ADVERTENCIA'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {biasAnalysis.classification === 'BLOQUEADO' ? (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : biasAnalysis.classification === 'ADVERTENCIA' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wider ${
                    biasAnalysis.classification === 'BLOQUEADO'
                      ? 'bg-rose-200 text-rose-900'
                      : biasAnalysis.classification === 'ADVERTENCIA'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  Clasificación: {biasAnalysis.classification}
                </span>
                <span className="text-xs opacity-75 font-mono">
                  Riesgo: {(biasAnalysis.riskScore * 100).toFixed(0)}%
                </span>
                {biasAnalysis.matchedCategories?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-slate-200 font-mono"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <p className="font-medium text-slate-800">{biasAnalysis.reason}</p>

              {biasAnalysis.suggestedAction && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
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
