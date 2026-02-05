import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the app is running in demo mode (no Supabase configured)
 * Works in both server and client environments
 * Uses a consistent check that doesn't depend on window
 */
export function isDemoMode(): boolean {
  // Check environment variable - works in both SSR and client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // If no URL is set, or it's the placeholder value, we're in demo mode
  if (!supabaseUrl || supabaseUrl.trim() === '') {
    return true;
  }
  
  // Check if it's the placeholder value
  if (supabaseUrl === 'your_supabase_url_here') {
    return true;
  }
  
  // If URL exists and is valid, not in demo mode
  return false;
}

/**
 * Extract province code or name from a Spanish address
 * @param address - Full address string
 * @returns Province code or name, or null if not found
 */
export function extractProvinceFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;

  // List of Spanish provinces with their common names and codes
  const provinces = [
    // Andalucía
    { codes: ["al"], names: ["almería", "almeria"] },
    { codes: ["ca"], names: ["cádiz", "cadiz"] },
    { codes: ["co"], names: ["córdoba", "cordoba"] },
    { codes: ["gr"], names: ["granada"] },
    { codes: ["h"], names: ["huelva"] },
    { codes: ["j"], names: ["jaén", "jaen"] },
    { codes: ["ma"], names: ["málaga", "malaga"] },
    { codes: ["se"], names: ["sevilla", "seville"] },
    // Aragón
    { codes: ["hu"], names: ["huesca"] },
    { codes: ["te"], names: ["teruel"] },
    { codes: ["z"], names: ["zaragoza"] },
    // Asturias
    { codes: ["o"], names: ["asturias", "oviedo"] },
    // Baleares
    { codes: ["pm"], names: ["baleares", "mallorca", "palma"] },
    // Canarias
    { codes: ["gc"], names: ["las palmas", "gran canaria"] },
    { codes: ["tf"], names: ["santa cruz de tenerife", "tenerife"] },
    // Cantabria
    { codes: ["s"], names: ["cantabria", "santander"] },
    // Castilla y León
    { codes: ["av"], names: ["ávila", "avila"] },
    { codes: ["bu"], names: ["burgos"] },
    { codes: ["le"], names: ["león", "leon"] },
    { codes: ["p"], names: ["palencia"] },
    { codes: ["sa"], names: ["salamanca"] },
    { codes: ["sg"], names: ["segovia"] },
    { codes: ["so"], names: ["soria"] },
    { codes: ["va"], names: ["valladolid"] },
    { codes: ["za"], names: ["zamora"] },
    // Castilla-La Mancha
    { codes: ["ab"], names: ["albacete"] },
    { codes: ["cr"], names: ["ciudad real"] },
    { codes: ["cu"], names: ["cuenca"] },
    { codes: ["gu"], names: ["guadalajara"] },
    { codes: ["to"], names: ["toledo"] },
    // Cataluña
    { codes: ["b"], names: ["barcelona"] },
    { codes: ["gi"], names: ["girona", "gerona"] },
    { codes: ["l"], names: ["lleida", "lerida"] },
    { codes: ["t"], names: ["tarragona"] },
    // Comunidad Valenciana
    { codes: ["a"], names: ["alicante"] },
    { codes: ["cs"], names: ["castellón", "castellon", "castelló"] },
    { codes: ["v"], names: ["valencia"] },
    // Extremadura
    { codes: ["ba"], names: ["badajoz"] },
    { codes: ["cc"], names: ["cáceres", "caceres"] },
    // Galicia
    { codes: ["c"], names: ["a coruña", "coruña", "coruna", "la coruña"] },
    { codes: ["lu"], names: ["lugo"] },
    { codes: ["or"], names: ["ourense", "orense"] },
    { codes: ["po"], names: ["pontevedra"] },
    // Madrid
    { codes: ["m"], names: ["madrid"] },
    // Murcia
    { codes: ["mu"], names: ["murcia"] },
    // Navarra
    { codes: ["na"], names: ["navarra", "pamplona"] },
    // País Vasco
    { codes: ["vi"], names: ["álava", "alava", "vitoria"] },
    { codes: ["ss"], names: ["guipúzcoa", "guipuzcoa", "san sebastián", "san sebastian", "donostia"] },
    { codes: ["bi"], names: ["vizcaya", "bilbao"] },
    // La Rioja
    { codes: ["lo"], names: ["la rioja", "rioja", "logroño", "logrono"] },
    // Ceuta y Melilla
    { codes: ["ce"], names: ["ceuta"] },
    { codes: ["ml"], names: ["melilla"] },
  ];

  const normalizedAddress = address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Try to find province by name first (more reliable)
  for (const province of provinces) {
    for (const name of province.names) {
      const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedAddress.includes(normalizedName)) {
        return province.codes[0]; // Return first code
      }
    }
  }

  // Try to extract from postal code pattern (first 2 digits often indicate province)
  // Spanish postal codes: 28xxx for Madrid, 08xxx for Barcelona, etc.
  const postalCodeMatch = normalizedAddress.match(/\b(\d{2})\d{3}\b/);
  if (postalCodeMatch) {
    const postalCodePrefix = postalCodeMatch[1];
    // Map common postal code prefixes to province codes
    const postalCodeMap: Record<string, string> = {
      "28": "m", // Madrid
      "08": "b", // Barcelona
      "48": "bi", // Vizcaya
      "20": "ss", // Guipúzcoa
      "01": "vi", // Álava
      "46": "v", // Valencia
      "03": "a", // Alicante
      "12": "cs", // Castellón
      "15": "c", // A Coruña
      "36": "po", // Pontevedra
      "27": "lu", // Lugo
      "32": "or", // Ourense
      "41": "se", // Sevilla
      "29": "ma", // Málaga
      "18": "gr", // Granada
      "14": "co", // Córdoba
      "23": "j", // Jaén
      "04": "al", // Almería
      "11": "ca", // Cádiz
      "21": "h", // Huelva
      "50": "z", // Zaragoza
      "33": "o", // Asturias
      "35": "gc", // Las Palmas
      "38": "tf", // Santa Cruz de Tenerife
      "39": "s", // Cantabria
      "24": "le", // León
      "34": "p", // Palencia
      "37": "sa", // Salamanca
      "40": "sg", // Segovia
      "42": "so", // Soria
      "47": "va", // Valladolid
      "49": "za", // Zamora
      "02": "ab", // Albacete
      "13": "cr", // Ciudad Real
      "16": "cu", // Cuenca
      "19": "gu", // Guadalajara
      "45": "to", // Toledo
      "06": "ba", // Badajoz
      "10": "cc", // Cáceres
      "31": "na", // Navarra
      "26": "lo", // La Rioja
      "30": "mu", // Murcia
      "07": "pm", // Baleares
    };

    if (postalCodeMap[postalCodePrefix]) {
      return postalCodeMap[postalCodePrefix];
    }
  }

  return null;
}
