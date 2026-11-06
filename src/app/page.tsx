'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBox } from '@/components/SearchBox';
import { ImageCard } from '@/components/ImageCard';
import { SearchHistoryModal } from '@/components/SearchHistoryModal';
import {
  PixabayImage,
  SavedImageItem,
  BiasAnalysisResult,
  SearchHistoryItem,
  BlacklistFilterInfo,
} from '@/types';
import {
  ImageIcon,
  Database,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldX,
  Server,
  FolderLock,
  Cpu,
} from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export default function Home() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'pixabay' | 'mongo'>('pixabay');

  // Filter Configuration
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [blacklistActive, setBlacklistActive] = useState<boolean>(true);
  const [blacklistInfo, setBlacklistInfo] = useState<BlacklistFilterInfo | null>(null);

  // Search State
  const [query, setQuery] = useState<string>('nature');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pixabayResults, setPixabayResults] = useState<PixabayImage[]>([]);
  const [totalHits, setTotalHits] = useState<number>(0);
  const [biasAnalysis, setBiasAnalysis] = useState<BiasAnalysisResult | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  // MongoDB State
  const [savedImages, setSavedImages] = useState<SavedImageItem[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [mongoConnected, setMongoConnected] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Health check on startup
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setMongoConnected(data.mongodb?.connected || false);
    } catch {
      setMongoConnected(false);
    }
  }, []);

  // Fetch saved images from MongoDB
  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/saved');
      const data = await res.json();
      if (data.ok) {
        setSavedImages(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching saved images:', err);
    }
  }, []);

  // Fetch search history from MongoDB
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.ok) {
        setHistory(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, []);

  // Primary Search Execution
  const handleSearch = async (searchTerm: string, overrideBlacklist?: boolean) => {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setIsLoading(true);
    setIsBlocked(false);

    const isExclude = overrideBlacklist !== undefined ? overrideBlacklist : blacklistActive;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&exclude_humans=${isExclude}`);
      const data = await res.json();

      setBiasAnalysis(data.biasAnalysis || null);
      setBlacklistInfo(data.blacklistInfo || null);

      if (data.blocked) {
        setIsBlocked(true);
        setPixabayResults([]);
        setTotalHits(0);
        addToast('warning', `Búsqueda bloqueada: ${data.message}`);
      } else if (data.ok) {
        setIsBlocked(false);
        setPixabayResults(data.hits || []);
        setTotalHits(data.totalHits || 0);

        if (data.blacklistInfo && data.blacklistInfo.filteredOutCount > 0) {
          addToast('info', `Blacklist: -${data.blacklistInfo.filteredOutCount} imágenes con personas eliminadas.`);
        } else if (data.biasAnalysis?.classification === 'ADVERTENCIA') {
          addToast('info', 'Término sensible: Supervisión ética activa.');
        } else {
          addToast('success', `Pixabay devolvió ${data.hits?.length || 0} imágenes limpias.`);
        }
      } else {
        addToast('error', data.error || 'Ocurrió un error al consultar Pixabay.');
      }

      // Refresh history and health status after search
      fetchHistory();
      checkHealth();
    } catch (err: any) {
      addToast('error', err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save image to MongoDB
  const handleSaveToMongo = async (img: PixabayImage) => {
    setSavingId(img.id);
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixabayId: img.id,
          pageURL: img.pageURL,
          type: img.type,
          tags: img.tags,
          previewURL: img.previewURL,
          webformatURL: img.webformatURL,
          largeImageURL: img.largeImageURL,
          views: img.views,
          downloads: img.downloads,
          likes: img.likes,
          comments: img.comments,
          user_id: img.user_id,
          user: img.user,
          userImageURL: img.userImageURL,
        }),
      });

      const data = await res.json();

      if (data.duplicate) {
        addToast('warning', 'La imagen ya existe en tu colección de MongoDB.');
      } else if (data.ok) {
        addToast('success', '¡Imagen guardada en MongoDB (saved_images)!');
        fetchSaved();
      } else {
        addToast('error', data.error || 'Error al guardar imagen.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error de red al guardar imagen.');
    } finally {
      setSavingId(null);
    }
  };

  // Delete image from MongoDB
  const handleDeleteFromMongo = async (pixabayId: number) => {
    try {
      const res = await fetch(`/api/saved?id=${pixabayId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setSavedImages((prev) => prev.filter((img) => img.pixabayId !== pixabayId));
        addToast('info', 'Imagen eliminada de MongoDB.');
      } else {
        addToast('error', data.message || 'Error al eliminar imagen.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error al eliminar imagen.');
    }
  };

  // Clear all search history
  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setHistory([]);
        addToast('info', 'Historial vaciado en MongoDB.');
      }
    } catch {
      addToast('error', 'No se pudo vaciar el historial.');
    }
  };

  // Initial load
  useEffect(() => {
    checkHealth();
    fetchSaved();
    fetchHistory();
    handleSearch('nature');
  }, []);

  const savedIdSet = new Set(savedImages.map((s) => s.pixabayId));

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-2xl border text-xs font-mono font-medium flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-bottom-3 pointer-events-auto ${
              t.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/60'
                : t.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-950/60'
                : t.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/60'
                : 'bg-slate-900/90 text-teal-200 border-teal-500/40 shadow-teal-950/60'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />}
            <span className="font-sans text-xs">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Modern High-Tech Navigation Bar */}
      <Header
        filterActive={filterActive}
        onToggleFilter={() => setFilterActive(!filterActive)}
        mongoConnected={mongoConnected}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Search Component with Mockup design, chips & Blacklist */}
        <SearchBox
          onSearch={(q) => handleSearch(q)}
          isLoading={isLoading}
          filterActive={filterActive}
          biasAnalysis={biasAnalysis}
          currentQuery={query}
          blacklistActive={blacklistActive}
          onToggleBlacklist={() => {
            const nextState = !blacklistActive;
            setBlacklistActive(nextState);
            handleSearch(query, nextState);
          }}
          blacklistInfo={blacklistInfo}
        />

        {/* High-Tech Tab Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-6 gap-3">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10">
            <button
              onClick={() => setActiveTab('pixabay')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition ${
                activeTab === 'pixabay'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>GALERÍA PIXABAY ({pixabayResults.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('mongo');
                fetchSaved();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition ${
                activeTab === 'mongo'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>COLECCIÓN MONGODB ({savedImages.length})</span>
            </button>
          </div>

          {/* Wireframe view badge identical to Mockup */}
          <div className="text-xs font-mono text-teal-400/80 flex items-center gap-2 self-end sm:self-center px-3 py-1 rounded-lg glass-panel border-teal-500/20">
            <Layers className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span>[ WIREFRAME VIEW: PIXABAY API RESPONSE GRID ]</span>
          </div>
        </div>

        {/* Tab 1: Pixabay Results Grid */}
        {activeTab === 'pixabay' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="glass-panel rounded-2xl p-4 animate-pulse space-y-3.5 border border-white/5">
                    <div className="aspect-[4/3] bg-slate-800/60 rounded-xl" />
                    <div className="h-4 bg-slate-800/60 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                    <div className="h-9 bg-slate-800/60 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : isBlocked ? (
              <div className="glass-panel border border-rose-500/30 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
                  <ShieldX className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase tracking-wide">
                  CONSULTA CENSURADA POR GUARDIA ÉTICA
                </h3>
                <p className="text-sm text-slate-300 mb-5 font-sans leading-relaxed">
                  {biasAnalysis?.reason}
                </p>
                <div className="p-3.5 bg-black/50 rounded-xl text-xs font-mono text-slate-400 border border-white/10 text-left space-y-1">
                  <div className="text-teal-400 font-bold">PROTOCOLO DE SEGURIDAD ACTIVADO:</div>
                  <div>&bull; La API de Pixabay NO fue consultada.</div>
                  <div>&bull; Se registró el intento en MongoDB (<code className="text-rose-300">search_history</code>) para auditoría.</div>
                </div>
              </div>
            ) : pixabayResults.length === 0 ? (
              <div className="glass-panel border border-white/10 rounded-3xl p-14 text-center text-slate-400 max-w-md mx-auto">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <h3 className="font-mono font-bold text-white text-sm mb-1 uppercase">SIN RESULTADOS DISPONIBLES</h3>
                <p className="text-xs text-slate-400">
                  No se encontraron imágenes para "{query}". Prueba con palabras clave del taller como "nature", "technology", "nigeria" o "peru".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {pixabayResults.map((img) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    mode="pixabay"
                    isSaved={savedIdSet.has(img.id)}
                    isSaving={savingId === img.id}
                    onSave={handleSaveToMongo}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: MongoDB Saved Images Collection */}
        {activeTab === 'mongo' && (
          <div>
            {savedImages.length === 0 ? (
              <div className="glass-panel border border-white/10 rounded-3xl p-14 text-center text-slate-400 max-w-md mx-auto">
                <FolderLock className="w-14 h-14 mx-auto mb-4 text-teal-400/50" />
                <h3 className="font-mono font-bold text-white text-base mb-1 uppercase tracking-wide">
                  COLECCIÓN NOSQL VACÍA
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aún no has guardado registros en la colección <code className="text-teal-300 font-mono">saved_images</code> de MongoDB.
                  Realiza una consulta en la galería de Pixabay y haz clic en <strong>"+ GUARDAR EN MONGO"</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-400 glass-panel p-4 rounded-2xl border border-white/10 gap-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Database className="w-4 h-4 text-teal-400" />
                    <span>Mostrando <strong className="text-white">{savedImages.length}</strong> imágenes persistidas en base de datos: <strong className="text-teal-300">pixabay_db</strong></span>
                  </div>
                  <span className="text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-[11px] self-start sm:self-auto">
                    PERSISTENCIA REAL DOCKER 7
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {savedImages.map((img) => (
                    <ImageCard
                      key={img.pixabayId}
                      image={img}
                      mode="mongo"
                      onDelete={handleDeleteFromMongo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Audit History Modal */}
      <SearchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectQuery={(q) => handleSearch(q)}
        onClearHistory={handleClearHistory}
        onRefreshHistory={fetchHistory}
      />

      {/* High-Tech Footer with System Telemetry */}
      <footer className="border-t border-white/10 glass-panel mt-auto py-6 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-semibold">TALLER PRÁCTICO: PIXABAY + MONGODB + FILTRO ANTISESGO</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap justify-center">
            <span>Next.js 14 App Router</span>
            <span>&bull;</span>
            <span>Docker Mongo 7 Port: 27017</span>
            <span>&bull;</span>
            <span>API Port: 3001</span>
            <span>&bull;</span>
            <span className="text-teal-400">Collaborator: Alejo0101</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
