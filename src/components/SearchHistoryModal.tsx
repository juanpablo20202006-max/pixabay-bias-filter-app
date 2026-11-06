'use client';

import React from 'react';
import { SearchHistoryItem } from '@/types';
import { Terminal, ShieldCheck, ShieldAlert, XCircle, Trash2, X, RefreshCw, Cpu, Database } from 'lucide-react';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  onRefreshHistory: () => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
  onRefreshHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Terminal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
                <span>CONSOLA DE AUDITORÍA NOSQL</span>
                <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-500/30">
                  MONGODB
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Colección: <code className="text-teal-300">search_history</code> &bull; ({history.length} eventos registrados)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshHistory}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition border border-white/5"
              title="Actualizar registros"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-rose-300 hover:text-white px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>VACIAR</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Logs List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 font-mono text-xs">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-400" />
              <p className="font-semibold text-slate-400">No hay registros de auditoría en MongoDB.</p>
              <p className="text-[11px] text-slate-600 mt-1">Ejecuta consultas para inspeccionar la persistencia NoSQL.</p>
            </div>
          ) : (
            history.map((item, idx) => {
              const classification = item.biasAnalysis?.classification || 'SEGURO';
              const isBlocked = classification === 'BLOQUEADO';
              const isWarning = classification === 'ADVERTENCIA';

              return (
                <div
                  key={item._id || idx}
                  className="p-3.5 rounded-xl border border-white/5 hover:border-teal-500/30 bg-slate-900/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          onSelectQuery(item.query);
                          onClose();
                        }}
                        className="font-bold text-sm text-teal-300 hover:text-teal-200 underline decoration-teal-500/50 hover:decoration-teal-400"
                      >
                        "{item.query}"
                      </button>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBlocked
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : isWarning
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {classification}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          item.pixabayQueried
                            ? 'bg-slate-800 text-slate-300 border border-white/5'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.pixabayQueried ? `PIXABAY: ${item.resultsCount} HITS` : 'PIXABAY: BLOQUEADO (0 HITS)'}
                      </span>

                      {item.blacklistInfo && item.blacklistInfo.filteredOutCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-purple-950/80 text-purple-300 border border-purple-500/30">
                          BLACKLIST: -{item.blacklistInfo.filteredOutCount} HUMANOS
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 text-[11px] font-sans">
                      {item.biasAnalysis?.reason}
                    </p>
                  </div>

                  <div className="shrink-0 text-slate-500 text-[10px] self-end sm:self-center">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold tracking-wider transition border border-white/10 active:scale-95"
          >
            CERRAR CONSOLA
          </button>
        </div>
      </div>
    </div>
  );
};
