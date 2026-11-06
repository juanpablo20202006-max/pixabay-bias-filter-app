import { MongoClient, Db, Collection } from 'mongodb';
import { SearchHistoryItem, SavedImageItem } from '@/types';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixabay_db';
const dbName = process.env.MONGODB_DB || 'pixabay_db';

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

declare const global: GlobalMongo & typeof globalThis;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

export async function getSearchHistoryCollection(): Promise<Collection<SearchHistoryItem>> {
  const db = await getDb();
  return db.collection<SearchHistoryItem>('search_history');
}

export async function getSavedImagesCollection(): Promise<Collection<SavedImageItem>> {
  const db = await getDb();
  return db.collection<SavedImageItem>('saved_images');
}

// Ensures indexes exist (called once on startup or healthcheck)
let indexesInitialized = false;
export async function initMongoIndexes(): Promise<void> {
  if (indexesInitialized) return;
  try {
    const savedCollection = await getSavedImagesCollection();
    // Unique index on pixabayId to strictly prevent duplicates
    await savedCollection.createIndex({ pixabayId: 1 }, { unique: true });

    const historyCollection = await getSearchHistoryCollection();
    await historyCollection.createIndex({ timestamp: -1 });

    indexesInitialized = true;
  } catch (error) {
    console.error('Error initializing MongoDB indexes:', error);
  }
}

// Operations for Search History
export async function recordSearchHistory(entry: Omit<SearchHistoryItem, '_id'>): Promise<SearchHistoryItem> {
  await initMongoIndexes();
  const collection = await getSearchHistoryCollection();
  const doc: SearchHistoryItem = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function fetchSearchHistory(limit: number = 50): Promise<SearchHistoryItem[]> {
  const collection = await getSearchHistoryCollection();
  const docs = await collection.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  return docs.map(doc => ({
    ...doc,
    _id: doc._id?.toString(),
  }));
}

export async function deleteSearchHistoryItem(idOrQuery: string): Promise<boolean> {
  const collection = await getSearchHistoryCollection();
  const result = await collection.deleteOne({ query: idOrQuery });
  return result.deletedCount > 0;
}

export async function clearAllSearchHistory(): Promise<boolean> {
  const collection = await getSearchHistoryCollection();
  await collection.deleteMany({});
  return true;
}

// Operations for Saved Images
export async function savePixabayImage(image: Omit<SavedImageItem, '_id'>): Promise<{ success: boolean; duplicate?: boolean; item?: SavedImageItem; message: string }> {
  await initMongoIndexes();
  const collection = await getSavedImagesCollection();

  // Check if image already exists
  const existing = await collection.findOne({ pixabayId: image.pixabayId });
  if (existing) {
    return {
      success: false,
      duplicate: true,
      item: { ...existing, _id: existing._id?.toString() },
      message: 'Esta imagen ya se encuentra en tu colección de MongoDB.',
    };
  }

  const newDoc: SavedImageItem = {
    ...image,
    savedAt: new Date().toISOString(),
  };

  try {
    const result = await collection.insertOne(newDoc);
    return {
      success: true,
      duplicate: false,
      item: { ...newDoc, _id: result.insertedId.toString() },
      message: 'Imagen guardada exitosamente en MongoDB.',
    };
  } catch (err: any) {
    if (err.code === 11000) {
      return {
        success: false,
        duplicate: true,
        message: 'Esta imagen ya se encuentra en tu colección de MongoDB.',
      };
    }
    throw err;
  }
}

export async function fetchSavedImages(): Promise<SavedImageItem[]> {
  await initMongoIndexes();
  const collection = await getSavedImagesCollection();
  const docs = await collection.find({}).sort({ savedAt: -1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    _id: doc._id?.toString(),
  }));
}

export async function deleteSavedPixabayImage(pixabayId: number): Promise<boolean> {
  const collection = await getSavedImagesCollection();
  const result = await collection.deleteOne({ pixabayId });
  return result.deletedCount > 0;
}

export async function checkIsImageSaved(pixabayId: number): Promise<boolean> {
  const collection = await getSavedImagesCollection();
  const count = await collection.countDocuments({ pixabayId }, { limit: 1 });
  return count > 0;
}
