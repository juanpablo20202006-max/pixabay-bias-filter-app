import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSavedImages,
  savePixabayImage,
  deleteSavedPixabayImage,
} from '@/lib/mongodb';
import { SavedImageItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await fetchSavedImages();
    return NextResponse.json({
      ok: true,
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('Error fetching saved images:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al obtener imágenes guardadas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SavedImageItem = await request.json();

    if (!body || !body.pixabayId) {
      return NextResponse.json(
        { ok: false, error: 'Datos de imagen inválidos o ID ausente.' },
        { status: 400 }
      );
    }

    const result = await savePixabayImage(body);

    if (result.duplicate) {
      return NextResponse.json(
        { ok: false, duplicate: true, message: result.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      duplicate: false,
      item: result.item,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error saving image:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al guardar la imagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: 'Parámetro id requerido.' },
        { status: 400 }
      );
    }

    const pixabayId = parseInt(idParam, 10);
    const deleted = await deleteSavedPixabayImage(pixabayId);

    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: 'La imagen no fue encontrada en la colección.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Imagen eliminada correctamente de MongoDB.',
    });
  } catch (error: any) {
    console.error('Error deleting saved image:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al eliminar la imagen' },
      { status: 500 }
    );
  }
}
