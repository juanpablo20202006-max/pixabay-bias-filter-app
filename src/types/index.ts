export type BiasClassification = 'SEGURO' | 'ADVERTENCIA' | 'BLOQUEADO';

export interface BiasAnalysisResult {
  classification: BiasClassification;
  riskScore: number; // 0 (safe) to 1 (blocked)
  reason: string;
  matchedCategories: string[];
  flags: {
    containsSensitiveIdentity: boolean;
    containsDerogatoryTerms: boolean;
    containsStereotypeContext: boolean;
    isLegitimateContext: boolean;
  };
  suggestedAction: string;
}

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  collections: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabayApiResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

export interface BlacklistFilterInfo {
  enabled: boolean;
  filteredOutCount: number;
  totalBeforeFilter: number;
  matchedTagsSample: string[];
}

export interface SearchHistoryItem {
  _id?: string;
  query: string;
  normalizedQuery: string;
  biasAnalysis: BiasAnalysisResult;
  blacklistInfo?: BlacklistFilterInfo;
  pixabayQueried: boolean;
  resultsCount: number;
  timestamp: string;
}

export interface SavedImageItem {
  _id?: string;
  pixabayId: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
  savedAt: string;
}
