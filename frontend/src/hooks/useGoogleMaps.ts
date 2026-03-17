const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string || '';

const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';

export interface GeoapifyPlace {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

export interface GeoapifyRouteResult {
  distanceKm: number;
  durationMin: number;
}

/**
 * Geoapify autocomplete — returns matching places for a text query.
 * Free tier: 3,000 requests/day, no credit card needed.
 */
export async function geoapifyAutocomplete(
  text: string,
  lang = 'en',
): Promise<GeoapifyPlace[]> {
  if (!text || text.length < 3 || !GEOAPIFY_API_KEY) return [];

  const params = new URLSearchParams({
    text,
    apiKey: GEOAPIFY_API_KEY,
    lang,
    limit: '5',
    format: 'json',
  });

  const res = await fetch(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    address: r.formatted ?? '',
    lat: r.lat ?? 0,
    lng: r.lon ?? 0,
    placeId: r.place_id ?? '',
  }));
}

/**
 * Geoapify routing — calculates driving distance & duration between two points.
 */
export async function geoapifyRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<GeoapifyRouteResult | null> {
  if (!GEOAPIFY_API_KEY) return null;

  const params = new URLSearchParams({
    waypoints: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
    mode: 'drive',
    apiKey: GEOAPIFY_API_KEY,
  });

  const res = await fetch(`${GEOAPIFY_ROUTING_URL}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const leg = data.features?.[0]?.properties;
  if (!leg) return null;

  return {
    distanceKm: parseFloat(((leg.distance ?? 0) / 1000).toFixed(1)),
    durationMin: Math.round((leg.time ?? 0) / 60),
  };
}

/**
 * Returns whether Geoapify is configured (API key present).
 */
export function useGeoapify() {
  return {
    isReady: !!GEOAPIFY_API_KEY,
    apiKey: GEOAPIFY_API_KEY,
  };
}
