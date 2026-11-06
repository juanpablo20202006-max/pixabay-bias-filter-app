import { NextRequest, NextResponse } from 'next/server';
import { analyzeBias } from '@/lib/bias-filter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query || '';
    const biasAnalysis = analyzeBias(query);

    return NextResponse.json({
      ok: true,
      query,
      biasAnalysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al analizar sesgos' },
      { status: 400 }
    );
  }
}
