import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: {
    mongodb: { connected: boolean; dbName?: string; error?: string };
    pixabay: { configured: boolean; keyMasked?: string };
    timestamp: string;
  } = {
    mongodb: { connected: false },
    pixabay: { configured: false },
    timestamp: new Date().toISOString(),
  };

  // Test MongoDB
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    status.mongodb.connected = true;
    status.mongodb.dbName = db.databaseName;
  } catch (err: any) {
    status.mongodb.connected = false;
    status.mongodb.error = err.message;
  }

  // Test Pixabay key configuration
  const key = process.env.PIXABAY_API_KEY;
  if (key && key.length > 8) {
    status.pixabay.configured = true;
    status.pixabay.keyMasked = `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  return NextResponse.json(status);
}
