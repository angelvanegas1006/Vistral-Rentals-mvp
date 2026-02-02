/**
 * Environment Configuration
 */

export type Environment = 'development' | 'staging' | 'production';

const environment: Environment = (process.env.NEXT_PUBLIC_ENV as Environment) || 'development';

export const config = {
  environment,
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',
  isProduction: environment === 'production',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  googleMaps: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
};

export function getSupabaseProjectName(): string {
  const url = config.supabase.url;
  if (!url) return 'unknown';
  try {
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}
