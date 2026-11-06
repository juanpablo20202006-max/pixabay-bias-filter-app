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
          addToast('info', `Blacklist: Se eliminaron ${data.blacklistInfo.filteredOutCount} imágenes con personas para mitigar sesgos.`);
        } else if (data.biasAnalysis?.classification === 'ADVERTENCIA') {
          addToast('info', 'Término sensible: Búsqueda permitida con supervisión de sesgos.');
        } else {
          addToast('success', `Se encontraron ${data.hits?.length || 0} imágenes purgadas de sesgos.`);
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
        addToast('success', '¡Imagen guardada exitosamente en MongoDB!');
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
        addToast('info', 'Historial vaciado.');
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
    // Default initial search to display nature images on load
    handleSearch('nature');
  }, []);

  // Determine saved IDs for instant button states
  const savedIdSet = new Set(savedImages.map((s) => s.pixabayId));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : t.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : t.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
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

        {/* Tabs Bar identical to Mockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pixabay')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                activeTab === 'pixabay'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Galería Pixabay ({pixabayResults.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('mongo');
                fetchSaved();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                activeTab === 'mongo'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Colección MongoDB ({savedImages.length})</span>
            </button>
          </div>

          {/* Right Wireframe Label identical to Mockup */}
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 self-end sm:self-center">
            <Layers className="w-3.5 h-3.5" />
            <span>[ Wireframe View: Pixabay API Response Grid ]</span>
          </div>
        </div>

        {/* Tab 1: Pixabay Results Grid */}
        {activeTab === 'pixabay' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-8 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : isBlocked ? (
              <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center max-w-xl mx-auto shadow-sm">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Consulta Bloqueada por Filtro Antisesgo</h3>
                <p className="text-sm text-slate-600 mb-4">{biasAnalysis?.reason}</p>
                <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-500 border border-slate-200">
                  Política: La API de Pixabay no fue consultada para evitar sesgos discriminatorios. La acción quedó registrada en MongoDB para auditoría.
                </div>
              </div>
            ) : pixabayResults.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">No se encontraron imágenes para "{query}".</p>
                <p className="text-xs text-slate-400 mt-1">Prueba con palabras clave como "technology", "nature", "black" o "poor".</p>
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
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <Database className="w-12 h-12 mx-auto mb-3 text-teal-500/40" />
                <h3 className="text-base font-bold text-slate-800 mb-1">Colección NoSQL Vacía</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Aún no has guardado imágenes en la colección <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700">saved_images</code> de MongoDB.
                  Realiza una búsqueda en la pestaña Pixabay y pulsa <strong>"+ Guardar en Mongo"</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                  <span>Mostrando {savedImages.length} imágenes persistidas en base de datos <strong>pixabay_db</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">Persistencia Real Docker 7 / Atlas</span>
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-medium text-slate-700">Taller Práctico: Pixabay API + MongoDB NoSQL + Filtro Antisesgo</p>
            <p className="text-[11px] text-slate-400">Arquitectura Limpia &bull; Next.js 14 &bull; TypeScript &bull; Docker MongoDB 7</p>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Backend Port: 3001 &bull; Mongo Port: 27017
          </div>
        </div>
      </footer>
    </div>
  );
}
