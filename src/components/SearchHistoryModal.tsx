'use client';

import React from 'react';
import { SearchHistoryItem } from '@/types';
import { Clock, ShieldCheck, ShieldAlert, XCircle, Trash2, X, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-800 text-base">Historial de Auditoría NoSQL (MongoDB)</h2>
              <p className="text-xs text-slate-500">Colección: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">search_history</code> ({history.length} registros)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshHistory}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
              title="Actualizar historial"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Aún no hay búsquedas registradas en MongoDB.</p>
              <p className="text-xs">Realiza consultas para auditar la clasificación antisesgo.</p>
            </div>
          ) : (
            history.map((item, idx) => {
              const classification = item.biasAnalysis?.classification || 'SEGURO';
              const isBlocked = classification === 'BLOQUEADO';
              const isWarning = classification === 'ADVERTENCIA';

              return (
                <div
                  key={item._id || idx}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          onSelectQuery(item.query);
                          onClose();
                        }}
                        className="font-bold text-sm text-teal-700 hover:underline flex items-center gap-1.5 text-left"
                      >
                        "{item.query}"
                      </button>

                      <span
                        className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {classification}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.pixabayQueried
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {item.pixabayQueried ? `Pixabay: ${item.resultsCount} hits` : 'Pixabay: No consultado'}
                      </span>

                      {item.blacklistInfo && item.blacklistInfo.filteredOutCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          Blacklist: -{item.blacklistInfo.filteredOutCount} personas
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 font-sans text-[11px]">
                      {item.biasAnalysis?.reason}
                    </p>
                  </div>

                  <div className="shrink-0 text-slate-400 font-mono text-[11px] self-end sm:self-center">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
