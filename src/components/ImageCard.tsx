'use client';

import React from 'react';
import { Heart, Eye, User, Database, Trash2, Check, ExternalLink, Sparkles, Tag } from 'lucide-react';
import { PixabayImage, SavedImageItem } from '@/types';

interface ImageCardProps {
  image: PixabayImage | SavedImageItem;
  isSaved?: boolean;
  isSaving?: boolean;
  onSave?: (image: PixabayImage) => void;
  onDelete?: (pixabayId: number) => void;
  mode: 'pixabay' | 'mongo';
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSaved = false,
  isSaving = false,
  onSave,
  onDelete,
  mode,
}) => {
  const pixabayId = 'pixabayId' in image ? image.pixabayId : image.id;
  const webformatURL = image.webformatURL || image.previewURL;
  const tagsList = image.tags ? image.tags.split(',').map((t) => t.trim()).slice(0, 3) : ['Paisaje'];
  const author = image.user || 'Anónimo';
  const likes = image.likes?.toLocaleString() || '0';
  const views = image.views?.toLocaleString() || '0';

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group border border-white/10 hover:border-teal-500/40 transition-all duration-300">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] bg-slate-950/80 overflow-hidden">
        <img
          src={webformatURL}
          alt={image.tags || 'Pixabay photo'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />

        {/* Top-Right Technical ID Badge */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-teal-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-teal-500/30 shadow-lg">
          ID: {pixabayId}
        </div>

        {/* External Link Overlay */}
        {image.pageURL && (
          <a
            href={image.pageURL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 left-3 bg-slate-900/80 hover:bg-teal-500 hover:text-white text-slate-300 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg border border-white/10"
            title="Ver fotografía en Pixabay"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Card Content & Telemetry */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          {/* Tags Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-[11px] font-mono text-slate-300"
              >
                <Tag className="w-2.5 h-2.5 text-teal-400" />
                <span>{tag}</span>
              </span>
            ))}
          </div>

          {/* Author Details */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">AUTOR: <strong className="text-slate-200 font-semibold">{author}</strong></span>
            </div>
          </div>

          {/* Stats Bar (Likes & Views) */}
          <div className="flex items-center justify-between text-xs font-mono py-2 mt-2 border-t border-white/5 text-slate-400">
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-400" />
              <span>{likes}</span>
            </span>
            <span className="flex items-center gap-1 text-teal-400">
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>{views}</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {mode === 'pixabay' ? (
            <button
              onClick={() => onSave && onSave(image as PixabayImage)}
              disabled={isSaved || isSaving}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border active:scale-95 ${
                isSaved
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 cursor-default shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white border-teal-400/30 shadow-lg shadow-teal-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>PERSISTIDO EN MONGO</span>
                </>
              ) : isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>GUARDANDO...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>+ GUARDAR EN MONGO</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onDelete && onDelete(pixabayId)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-950/40 active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>ELIMINAR DE MONGO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
