/**
 * ITP (Impuesto de Transmisiones Patrimoniales) rates by Spanish province
 * ITP rates vary by autonomous community and province in Spain
 */

export interface ITPRate {
  province: string;
  rate: number; // Percentage as decimal (e.g., 0.10 for 10%)
  autonomousCommunity: string;
}

/**
 * ITP rates mapping by province code (ISO 3166-2:ES)
 * Default rates based on standard Spanish ITP rates
 */
export const ITP_RATES_BY_PROVINCE: Record<string, ITPRate> = {
  // Andalucía (8%)
  "al": { province: "Almería", rate: 0.08, autonomousCommunity: "Andalucía" },
  "ca": { province: "Cádiz", rate: 0.08, autonomousCommunity: "Andalucía" },
  "co": { province: "Córdoba", rate: 0.08, autonomousCommunity: "Andalucía" },
  "gr": { province: "Granada", rate: 0.08, autonomousCommunity: "Andalucía" },
  "h": { province: "Huelva", rate: 0.08, autonomousCommunity: "Andalucía" },
  "j": { province: "Jaén", rate: 0.08, autonomousCommunity: "Andalucía" },
  "ma": { province: "Málaga", rate: 0.08, autonomousCommunity: "Andalucía" },
  "se": { province: "Sevilla", rate: 0.08, autonomousCommunity: "Andalucía" },
  
  // Aragón (8%)
  "hu": { province: "Huesca", rate: 0.08, autonomousCommunity: "Aragón" },
  "te": { province: "Teruel", rate: 0.08, autonomousCommunity: "Aragón" },
  "z": { province: "Zaragoza", rate: 0.08, autonomousCommunity: "Aragón" },
  
  // Asturias (8%)
  "o": { province: "Asturias", rate: 0.08, autonomousCommunity: "Asturias" },
  
  // Baleares (8%)
  "pm": { province: "Baleares", rate: 0.08, autonomousCommunity: "Baleares" },
  
  // Canarias (6.5%)
  "gc": { province: "Las Palmas", rate: 0.065, autonomousCommunity: "Canarias" },
  "tf": { province: "Santa Cruz de Tenerife", rate: 0.065, autonomousCommunity: "Canarias" },
  
  // Cantabria (8%)
  "s": { province: "Cantabria", rate: 0.08, autonomousCommunity: "Cantabria" },
  
  // Castilla y León (8%)
  "av": { province: "Ávila", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "bu": { province: "Burgos", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "le": { province: "León", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "p": { province: "Palencia", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "sa": { province: "Salamanca", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "sg": { province: "Segovia", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "so": { province: "Soria", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "va": { province: "Valladolid", rate: 0.08, autonomousCommunity: "Castilla y León" },
  "za": { province: "Zamora", rate: 0.08, autonomousCommunity: "Castilla y León" },
  
  // Castilla-La Mancha (8%)
  "ab": { province: "Albacete", rate: 0.08, autonomousCommunity: "Castilla-La Mancha" },
  "cr": { province: "Ciudad Real", rate: 0.08, autonomousCommunity: "Castilla-La Mancha" },
  "cu": { province: "Cuenca", rate: 0.08, autonomousCommunity: "Castilla-La Mancha" },
  "gu": { province: "Guadalajara", rate: 0.08, autonomousCommunity: "Castilla-La Mancha" },
  "to": { province: "Toledo", rate: 0.08, autonomousCommunity: "Castilla-La Mancha" },
  
  // Cataluña (10%)
  "b": { province: "Barcelona", rate: 0.10, autonomousCommunity: "Cataluña" },
  "gi": { province: "Girona", rate: 0.10, autonomousCommunity: "Cataluña" },
  "l": { province: "Lleida", rate: 0.10, autonomousCommunity: "Cataluña" },
  "t": { province: "Tarragona", rate: 0.10, autonomousCommunity: "Cataluña" },
  
  // Comunidad Valenciana (10%)
  "a": { province: "Alicante", rate: 0.10, autonomousCommunity: "Comunidad Valenciana" },
  "cs": { province: "Castellón", rate: 0.10, autonomousCommunity: "Comunidad Valenciana" },
  "v": { province: "Valencia", rate: 0.10, autonomousCommunity: "Comunidad Valenciana" },
  
  // Extremadura (8%)
  "ba": { province: "Badajoz", rate: 0.08, autonomousCommunity: "Extremadura" },
  "cc": { province: "Cáceres", rate: 0.08, autonomousCommunity: "Extremadura" },
  
  // Galicia (8%)
  "c": { province: "A Coruña", rate: 0.08, autonomousCommunity: "Galicia" },
  "lu": { province: "Lugo", rate: 0.08, autonomousCommunity: "Galicia" },
  "or": { province: "Ourense", rate: 0.08, autonomousCommunity: "Galicia" },
  "po": { province: "Pontevedra", rate: 0.08, autonomousCommunity: "Galicia" },
  
  // Madrid (6%)
  "m": { province: "Madrid", rate: 0.06, autonomousCommunity: "Madrid" },
  
  // Murcia (8%)
  "mu": { province: "Murcia", rate: 0.08, autonomousCommunity: "Murcia" },
  
  // Navarra (6%)
  "na": { province: "Navarra", rate: 0.06, autonomousCommunity: "Navarra" },
  
  // País Vasco (4%)
  "vi": { province: "Álava", rate: 0.04, autonomousCommunity: "País Vasco" },
  "ss": { province: "Guipúzcoa", rate: 0.04, autonomousCommunity: "País Vasco" },
  "bi": { province: "Vizcaya", rate: 0.04, autonomousCommunity: "País Vasco" },
  
  // La Rioja (8%)
  "lo": { province: "La Rioja", rate: 0.08, autonomousCommunity: "La Rioja" },
  
  // Ceuta y Melilla (4%)
  "ce": { province: "Ceuta", rate: 0.04, autonomousCommunity: "Ceuta" },
  "ml": { province: "Melilla", rate: 0.04, autonomousCommunity: "Melilla" },
};

/**
 * Default ITP rate if province is not found (8% - most common rate)
 */
export const DEFAULT_ITP_RATE = 0.08;

/**
 * Get ITP rate for a given province code or name
 * @param provinceCodeOrName - Province code (e.g., "m" for Madrid) or province name
 * @returns ITP rate as decimal (e.g., 0.10 for 10%)
 */
export function getITPRate(provinceCodeOrName: string | null | undefined): number {
  if (!provinceCodeOrName) {
    return DEFAULT_ITP_RATE;
  }

  const normalized = provinceCodeOrName.toLowerCase().trim();
  
  // Try exact match first
  if (ITP_RATES_BY_PROVINCE[normalized]) {
    return ITP_RATES_BY_PROVINCE[normalized].rate;
  }

  // Try to find by province name (case-insensitive partial match)
  const matchingEntry = Object.values(ITP_RATES_BY_PROVINCE).find(
    (entry) => entry.province.toLowerCase().includes(normalized) ||
               normalized.includes(entry.province.toLowerCase())
  );

  if (matchingEntry) {
    return matchingEntry.rate;
  }

  // Default rate if not found
  return DEFAULT_ITP_RATE;
}

/**
 * Get ITP rate information for a given province
 * @param provinceCodeOrName - Province code or name
 * @returns ITP rate information object or null
 */
export function getITPRateInfo(provinceCodeOrName: string | null | undefined): ITPRate | null {
  if (!provinceCodeOrName) {
    return null;
  }

  const normalized = provinceCodeOrName.toLowerCase().trim();
  
  // Try exact match first
  if (ITP_RATES_BY_PROVINCE[normalized]) {
    return ITP_RATES_BY_PROVINCE[normalized];
  }

  // Try to find by province name
  const matchingEntry = Object.values(ITP_RATES_BY_PROVINCE).find(
    (entry) => entry.province.toLowerCase().includes(normalized) ||
               normalized.includes(entry.province.toLowerCase())
  );

  return matchingEntry || null;
}
