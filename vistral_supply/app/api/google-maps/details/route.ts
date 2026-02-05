import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json(
      { error: 'place_id es requerido' },
      { status: 400 }
    );
  }

  if (!config.googleMaps.apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key no configurada' },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', config.googleMaps.apiKey);
    url.searchParams.append('language', 'es');
    url.searchParams.append('fields', 'place_id,formatted_address,address_components,geometry,name');

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Google Maps Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del lugar', details: error.message },
      { status: 500 }
    );
  }
}
