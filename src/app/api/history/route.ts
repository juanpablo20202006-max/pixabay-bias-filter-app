import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSearchHistory,
  deleteSearchHistoryItem,
  clearAllSearchHistory,
} from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const items = await fetchSearchHistory(limit);

    return NextResponse.json({
      ok: true,
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('Error fetching search history:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (query) {
      const deleted = await deleteSearchHistoryItem(query);
      return NextResponse.json({
        ok: true,
        deleted,
        message: deleted ? 'Elemento eliminado del historial.' : 'Elemento no encontrado.',
      });
    }

    await clearAllSearchHistory();
    return NextResponse.json({
      ok: true,
      message: 'Historial de búsquedas vaciado correctamente.',
    });
  } catch (error: any) {
    console.error('Error deleting history:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al vaciar historial' },
      { status: 500 }
    );
  }
}
