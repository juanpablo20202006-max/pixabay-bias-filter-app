'use client';

import React from 'react';
import { Heart, Eye, Download, User, Database, Trash2, Check, ExternalLink } from 'lucide-react';
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
  const tags = image.tags ? image.tags.split(',').map((t) => t.trim()).slice(0, 3).join(', ') : 'Imagen';
  const author = image.user || 'Desconocido';
  const likes = image.likes?.toLocaleString() || '0';
  const views = image.views?.toLocaleString() || '0';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition group">
      {/* Thumbnail Container with ID badge identical to Mockup */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={webformatURL}
          alt={image.tags || 'Pixabay photo'}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />

        {/* Top-Right Mockup ID Badge */}
        <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-white/20 shadow-sm">
          ID: {pixabayId}
        </div>

        {/* External Link Overlay */}
        {image.pageURL && (
          <a
            href={image.pageURL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2.5 left-2.5 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded opacity-0 group-hover:opacity-100 transition shadow-sm"
            title="Ver en Pixabay"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Card Content identical to Mockup */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1 line-clamp-1">
            <span className="text-teal-600">🏷️</span>
            <span>{tags}</span>
          </div>

          {/* Author */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Autor: <strong className="text-slate-700 font-medium">{author}</strong></span>
          </div>

          {/* Stats: Likes & Views */}
          <div className="flex items-center gap-4 text-xs text-slate-500 py-2 border-t border-slate-100 mb-3">
            <span className="flex items-center gap-1 text-rose-500 font-medium">
              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
              <span>{likes}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Eye className="w-3.5 h-3.5" />
              <span>{views}</span>
            </span>
          </div>
        </div>

        {/* Action Button as shown in Mockup: [💾 + Guardar en Mongo] or [🗑 Eliminar] */}
        <div>
          {mode === 'pixabay' ? (
            <button
              onClick={() => onSave && onSave(image as PixabayImage)}
              disabled={isSaved || isSaving}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 cursor-default'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 active:scale-[0.98]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guardado en MongoDB</span>
                </>
              ) : isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+ Guardar en Mongo</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onDelete && onDelete(pixabayId)}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar de Mongo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
