import { NextRequest, NextResponse } from 'next/server';
import { analyzeBias, filterImagesByHumanBlacklist } from '@/lib/bias-filter';
import { recordSearchHistory } from '@/lib/mongodb';
import { PixabayApiResponse, PixabayImage } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '12', 10);
    // Exclude humans by default using the algorithmic bias blacklist
    const excludeHumans = searchParams.get('exclude_humans') !== 'false';

    if (!query.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Debes proporcionar un término de búsqueda.' },
        { status: 400 }
      );
    }

    // Step 1: Run Algorithmic Bias Filter Analysis on the query
    const biasAnalysis = analyzeBias(query);

    // Step 2: If query is BLOCKED, do NOT call Pixabay API.
    // Record to search history for auditing and return blocked response.
    if (biasAnalysis.classification === 'BLOQUEADO') {
      try {
        await recordSearchHistory({
          query: query.trim(),
          normalizedQuery: query.trim().toLowerCase(),
          biasAnalysis,
          pixabayQueried: false,
          resultsCount: 0,
          timestamp: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Failed to record blocked query in history:', dbErr);
      }

      return NextResponse.json({
        ok: false,
        blocked: true,
        biasAnalysis,
        message: biasAnalysis.reason,
        hits: [],
        total: 0,
        totalHits: 0,
      });
    }

    // Step 3: Query Pixabay API securely (API Key is NEVER exposed to client)
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'La API Key de Pixabay no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    // Fetch a larger candidate pool (e.g. 40 hits) so that after filtering out humans,
    // we still have a robust set of results to render
    const candidateFetchCount = excludeHumans ? Math.max(perPage * 3, 40) : perPage;

    const pixabayUrl = new URL('https://pixabay.com/api/');
    pixabayUrl.searchParams.set('key', apiKey);
    pixabayUrl.searchParams.set('q', query.trim());
    pixabayUrl.searchParams.set('image_type', 'photo');
    pixabayUrl.searchParams.set('page', page.toString());
    pixabayUrl.searchParams.set('per_page', candidateFetchCount.toString());
    pixabayUrl.searchParams.set('safesearch', 'true');

    const res = await fetch(pixabayUrl.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Pixabay API error:', res.status, errText);
      return NextResponse.json(
        { ok: false, error: `Error en el servicio de Pixabay (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data: PixabayApiResponse = await res.json();

    // Step 4: Apply Post-Query Blacklist to eliminate humans, faces, portraits and demographic stereotypes
    let finalHits: PixabayImage[] = data.hits || [];
    let blacklistInfo = {
      enabled: excludeHumans,
      filteredOutCount: 0,
      totalBeforeFilter: (data.hits || []).length,
      matchedTagsSample: [] as string[],
    };

    if (excludeHumans && finalHits.length > 0) {
      const filterResult = filterImagesByHumanBlacklist(finalHits);
      finalHits = filterResult.cleanImages.slice(0, perPage);
      blacklistInfo.filteredOutCount = filterResult.filteredOutCount;
      blacklistInfo.matchedTagsSample = filterResult.matchedTagsSample;
    } else {
      finalHits = finalHits.slice(0, perPage);
    }

    // Step 5: Record permitted/warned search to MongoDB history
    try {
      await recordSearchHistory({
        query: query.trim(),
        normalizedQuery: query.trim().toLowerCase(),
        biasAnalysis,
        blacklistInfo,
        pixabayQueried: true,
        resultsCount: finalHits.length,
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('Failed to record search in history:', dbErr);
    }

    return NextResponse.json({
      ok: true,
      blocked: false,
      biasAnalysis,
      blacklistInfo,
      total: data.total,
      totalHits: data.totalHits,
      hits: finalHits,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/search:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
