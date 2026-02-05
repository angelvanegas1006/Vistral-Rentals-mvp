import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');
  const countryRestriction = searchParams.get('country') || 'es';

  if (!input || input.length < 3) {
    return NextResponse.json(
      { error: 'Input debe tener al menos 3 caracteres' },
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
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('key', config.googleMaps.apiKey);
    url.searchParams.append('language', 'es');
    url.searchParams.append('components', `country:${countryRestriction}`);
    url.searchParams.append('types', 'address');

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Google Maps Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con Google Maps API', details: error.message },
      { status: 500 }
    );
  }
}
