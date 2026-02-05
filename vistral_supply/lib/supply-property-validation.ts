import { PropertyData, Orientation, VendedorData, InquilinoData } from "./supply-property-storage";
import { ChecklistData, ChecklistSection, ChecklistStatus, ChecklistUploadZone, ChecklistQuestion, ChecklistDynamicItem, ChecklistCarpentryItem, ChecklistClimatizationItem, ChecklistStorageItem, ChecklistApplianceItem, ChecklistSecurityItem, ChecklistSystemItem } from "./supply-checklist-storage";

export interface SectionProgress {
  sectionId: string;
  name: string;
  progress: number; // 0-100
  requiredFieldsCount: number;
  completedRequiredFieldsCount: number;
  optionalFieldsCount: number;
  completedOptionalFieldsCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  missingSections?: string[]; // Checklist sections that are incomplete
}

// Calculate progress for "Información de la propiedad" section
function calculateInfoPropiedadProgress(data?: PropertyData, propertyType?: string): number {
  if (!data && !propertyType) return 0;
  
  // Use propertyType from Property if tipoPropiedad is not in data
  const tipoPropiedad = data?.tipoPropiedad || propertyType;
  
  // Required fields: tipoPropiedad, superficieConstruida, anoConstruccion, referenciaCatastral, orientacion (at least one)
  const requiredFields = [
    tipoPropiedad,
    data?.superficieConstruida,
    data?.anoConstruccion,
    data?.referenciaCatastral,
    data?.orientacion && data.orientacion.length > 0 ? data.orientacion : undefined,
  ];
  const completedRequired = requiredFields.filter(
    (v) => v !== undefined && v !== null && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
  ).length;
  const totalRequired = requiredFields.length;
  
  // Optional fields: habitaciones, banos, plazasAparcamiento (0 counts as complete, no need to interact)
  // Checkboxes: ascensor, balconTerraza, trastero (false counts as complete)
  // Superficie útil is completely optional and doesn't affect progress
  const optionalFields = [
    // Numeric fields: 0 or any value counts as complete (field exists in data)
    data?.habitaciones !== undefined ? (data.habitaciones >= 0 ? true : false) : undefined,
    data?.banos !== undefined ? (data.banos >= 0 ? true : false) : undefined,
    data?.plazasAparcamiento !== undefined ? (data.plazasAparcamiento >= 0 ? true : false) : undefined,
    // Checkboxes: false or true counts as complete (field exists in data)
    data?.ascensor !== undefined,
    data?.balconTerraza !== undefined,
    data?.trastero !== undefined,
  ];
  const completedOptional = optionalFields.filter(
    (v) => v === true
  ).length;
  const totalOptional = optionalFields.length;
  
  // Only required fields count for 100% (superficie útil is completely excluded)
  if (totalRequired === 0) return 0;
  return Math.round((completedRequired / totalRequired) * 100);
}

// Calculate progress for "Información económica" section
function calculateInfoEconomicaProgress(data?: PropertyData): number {
  if (!data) return 0;
  
  // Only precioVenta, gastosComunidad, and ibiAnual are required
  // confirmacionGastosComunidad and confirmacionIBI are optional checkboxes
  const requiredFields = [
    data.precioVenta,
    data.gastosComunidad,
    data.ibiAnual,
  ];
  const completedRequired = requiredFields.filter(
    (v) => v !== undefined && v !== null && v !== 0
  ).length;
  const totalRequired = requiredFields.length;
  
  if (totalRequired === 0) return 0;
  return Math.round((completedRequired / totalRequired) * 100);
}

// Calculate progress for "Estado legal y de comunidad" section
function calculateEstadoLegalProgress(data?: PropertyData): number {
  if (!data) return 0;
  
  const required = [
    data.comunidadPropietariosConstituida !== undefined,
    data.edificioSeguroActivo !== undefined,
    data.comercializaExclusiva !== undefined,
    data.edificioITEfavorable !== undefined,
    data.propiedadAlquilada !== undefined,
  ].filter((v) => v === true).length;
  
  // If propiedadAlquilada is true and situacionInquilinos is set
  let conditionalFields = 0;
  if (data.propiedadAlquilada === true && data.situacionInquilinos) {
    conditionalFields = 1;
  }
  
  const total = 5 + conditionalFields;
  const completed = required + conditionalFields;
  
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Calculate progress for "Documentación mínima" section
function calculateDocumentacionProgress(data?: PropertyData): number {
  if (!data) return 0;
  
  // All fields are optional now (videoGeneral removed)
  // Calculate progress based on optional fields completed
  const optionalFields = [
    data.notaSimpleRegistro && data.notaSimpleRegistro.length > 0,
    data.certificadoEnergetico && data.certificadoEnergetico.length > 0,
  ];
  
  const totalOptional = optionalFields.length;
  const completedOptional = optionalFields.filter(Boolean).length;
  
  if (totalOptional === 0) return 0;
  return Math.round((completedOptional / totalOptional) * 100);
}

// Calculate progress for "Datos del Vendedor" section
function calculateDatosVendedorProgress(data?: PropertyData): number {
  if (!data || !data.vendedores || data.vendedores.length === 0) return 0;
  
  // Required fields: nombreCompleto, dniNifCif, email, telefonoPais, telefonoNumero
  // dniAdjunto is optional (files can be uploaded later)
  const requiredFieldsPerVendedor = 5; // nombreCompleto, dniNifCif, email, telefonoPais, telefonoNumero
  let totalCompleted = 0;
  let totalRequired = 0;
  
  data.vendedores.forEach((vendedor) => {
    totalRequired += requiredFieldsPerVendedor;
    let completed = 0;
    
    if (vendedor.nombreCompleto) completed++;
    if (vendedor.dniNifCif) completed++;
    if (vendedor.email) completed++;
    if (vendedor.telefonoPais) completed++;
    if (vendedor.telefonoNumero) completed++;
    // dniAdjunto is optional, not counted in progress
    
    totalCompleted += completed;
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((totalCompleted / totalRequired) * 100);
}

// Calculate progress for "Datos del Inquilino" section
function calculateDatosInquilinoProgress(data?: PropertyData): number {
  if (!data || !data.inquilino) return 0;
  
  const inquilino = data.inquilino;
  const requiredFields = [
    inquilino.nombreCompleto,
    inquilino.email,
    inquilino.telefonoPais,
    inquilino.telefonoNumero,
    inquilino.dniNie && inquilino.dniNie.length > 0,
    inquilino.contratoArrendamiento && inquilino.contratoArrendamiento.length > 0,
    inquilino.fechaFinalizacionContrato,
    inquilino.periodoPreaviso !== undefined,
    inquilino.subrogacionContrato,
    inquilino.importeAlquilerTransferir,
    inquilino.ultimaActualizacionAlquiler,
    inquilino.justificantesPago && inquilino.justificantesPago.length > 0,
    inquilino.fechaUltimoRecibo,
    inquilino.comprobanteTransferenciaVendedor && inquilino.comprobanteTransferenciaVendedor.length > 0,
    inquilino.justificanteDeposito && inquilino.justificanteDeposito.length > 0,
    inquilino.fechaVencimientoSeguroAlquiler,
    inquilino.estadoSeguroAlquiler,
    inquilino.proveedorSeguroAlquiler,
  ];
  
  const completed = requiredFields.filter((v) => v !== undefined && v !== null && v !== "" && v !== false).length;
  const total = requiredFields.length;
  
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Calculate overall progress - based on completed sections (not individual fields)
// Total sections: 3 basic property sections + 8 checklist sections = 11 sections
// Documentación section is optional and not counted
export function calculateOverallProgress(
  data?: PropertyData, 
  showInquilino?: boolean, 
  propertyType?: string,
  checklist?: ChecklistData
): number {
  const totalSections = 11; // 3 basic (excluding documentacion) + 8 checklist
  
  let completedSections = 0;
  
  // Basic property sections (must be 100% complete to count)
  // Documentación is optional and not included
  if (calculateInfoPropiedadProgress(data, propertyType) === 100) completedSections++;
  if (calculateInfoEconomicaProgress(data) === 100) completedSections++;
  if (calculateEstadoLegalProgress(data) === 100) completedSections++;
  // Documentación section is optional, not counted
  
  // Checklist sections (must be 100% complete to count)
  if (checklist && checklist.sections) {
    if (validateEntornoZonasComunes(checklist.sections["entorno-zonas-comunes"])) completedSections++;
    if (validateEstadoGeneral(checklist.sections["estado-general"])) completedSections++;
    if (validateEntradaPasillos(checklist.sections["entrada-pasillos"])) completedSections++;
    if (validateHabitaciones(checklist.sections["habitaciones"])) completedSections++;
    if (validateSalon(checklist.sections["salon"])) completedSections++;
    if (validateBanos(checklist.sections["banos"])) completedSections++;
    if (validateCocina(checklist.sections["cocina"])) completedSections++;
    if (validateExteriores(checklist.sections["exteriores"])) completedSections++;
  }
  
  return Math.round((completedSections / totalSections) * 100);
}

// Get progress for all sections
export function getAllSectionsProgress(
  data?: PropertyData, 
  showInquilino?: boolean, 
  propertyType?: string,
  translations?: { property: { sections: Record<string, string> }, sidebar: Record<string, string> },
  checklist?: ChecklistData
): SectionProgress[] {
  const tipoPropiedad = data?.tipoPropiedad || propertyType;
  
  const sections: SectionProgress[] = [
    {
      sectionId: "info-propiedad",
      name: translations?.property.sections.basicInfo || "Información de la propiedad",
      progress: calculateInfoPropiedadProgress(data, propertyType),
      requiredFieldsCount: 5,
      completedRequiredFieldsCount: data || propertyType ? [
        tipoPropiedad,
        data?.superficieConstruida,
        data?.anoConstruccion,
        data?.referenciaCatastral,
        data?.orientacion && data.orientacion.length > 0 ? data.orientacion : undefined, // At least one orientation
      ].filter((v) => v !== undefined && v !== null && v !== "" && (Array.isArray(v) ? v.length > 0 : true)).length : 0,
      optionalFieldsCount: 6, // Excluding superficieUtil
      completedOptionalFieldsCount: data ? [
        // Numeric fields: 0 or any value counts as complete
        data.habitaciones !== undefined ? (data.habitaciones >= 0 ? true : false) : undefined,
        data.banos !== undefined ? (data.banos >= 0 ? true : false) : undefined,
        data.plazasAparcamiento !== undefined ? (data.plazasAparcamiento >= 0 ? true : false) : undefined,
        // Checkboxes: false or true counts as complete
        data.ascensor !== undefined,
        data.balconTerraza !== undefined,
        data.trastero !== undefined,
      ].filter((v) => v === true).length : 0,
    },
    {
      sectionId: "info-economica",
      name: translations?.property.sections.economicInfo || "Información económica",
      progress: calculateInfoEconomicaProgress(data),
      requiredFieldsCount: 3, // Only precioVenta, gastosComunidad, ibiAnual
      completedRequiredFieldsCount: data ? [
        data.precioVenta,
        data.gastosComunidad,
        data.ibiAnual,
      ].filter((v) => v !== undefined && v !== null && v !== 0).length : 0,
      optionalFieldsCount: 2, // confirmacionGastosComunidad, confirmacionIBI
      completedOptionalFieldsCount: data ? [
        data.confirmacionGastosComunidad,
        data.confirmacionIBI,
      ].filter((v) => v === true).length : 0,
    },
    {
      sectionId: "estado-legal",
      name: translations?.property.sections.legalStatus || "Estado legal y de comunidad",
      progress: calculateEstadoLegalProgress(data),
      requiredFieldsCount: data?.propiedadAlquilada ? 6 : 5,
      completedRequiredFieldsCount: data ? [
        data.comunidadPropietariosConstituida !== undefined,
        data.edificioSeguroActivo !== undefined,
        data.comercializaExclusiva !== undefined,
        data.edificioITEfavorable !== undefined,
        data.propiedadAlquilada !== undefined,
        data.propiedadAlquilada === true && data.situacionInquilinos !== undefined,
      ].filter((v) => v === true).length : 0,
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    },
    {
      sectionId: "documentacion",
      name: translations?.property.sections.documentation || "Documentación mínima",
      progress: calculateDocumentacionProgress(data),
      requiredFieldsCount: 0,
      completedRequiredFieldsCount: 0,
      optionalFieldsCount: 2,
      completedOptionalFieldsCount: data ? [
        data.notaSimpleRegistro && data.notaSimpleRegistro.length > 0,
        data.certificadoEnergetico && data.certificadoEnergetico.length > 0,
      ].filter((v) => v === true).length : 0,
    },
  ];

  // Add Datos del Vendedor section
  const vendedorProgress = calculateDatosVendedorProgress(data);
  const vendedores = data?.vendedores || [];
  const vendedorRequiredFields = vendedores.length * 5; // 5 required fields per vendedor (dniAdjunto is optional)
  let vendedorCompletedFields = 0;
  vendedores.forEach((v) => {
    if (v.nombreCompleto) vendedorCompletedFields++;
    if (v.dniNifCif) vendedorCompletedFields++;
    if (v.email) vendedorCompletedFields++;
    if (v.telefonoPais) vendedorCompletedFields++;
    if (v.telefonoNumero) vendedorCompletedFields++;
    // dniAdjunto is optional, not counted
  });
  
  sections.push({
    sectionId: "datos-vendedor",
    name: translations?.property.sections.sellerData || "Datos del vendedor",
    progress: vendedorProgress,
    requiredFieldsCount: Math.max(5, vendedorRequiredFields), // At least 1 vendedor (5 required fields)
    completedRequiredFieldsCount: Math.max(0, vendedorCompletedFields),
    optionalFieldsCount: 1, // dniAdjunto is optional
    completedOptionalFieldsCount: vendedores.filter(v => v.dniAdjunto && v.dniAdjunto.length > 0).length,
  });

  // Add inquilino section if needed
  if (showInquilino) {
    const inquilinoProgress = calculateDatosInquilinoProgress(data);
    const inquilino = data?.inquilino;
    const inquilinoRequiredFields = 18;
    let inquilinoCompletedFields = 0;
    if (inquilino) {
      if (inquilino.nombreCompleto) inquilinoCompletedFields++;
      if (inquilino.email) inquilinoCompletedFields++;
      if (inquilino.telefonoPais) inquilinoCompletedFields++;
      if (inquilino.telefonoNumero) inquilinoCompletedFields++;
      if (inquilino.dniNie && inquilino.dniNie.length > 0) inquilinoCompletedFields++;
      if (inquilino.contratoArrendamiento && inquilino.contratoArrendamiento.length > 0) inquilinoCompletedFields++;
      if (inquilino.fechaFinalizacionContrato) inquilinoCompletedFields++;
      if (inquilino.periodoPreaviso !== undefined) inquilinoCompletedFields++;
      if (inquilino.subrogacionContrato) inquilinoCompletedFields++;
      if (inquilino.importeAlquilerTransferir) inquilinoCompletedFields++;
      if (inquilino.ultimaActualizacionAlquiler) inquilinoCompletedFields++;
      if (inquilino.justificantesPago && inquilino.justificantesPago.length > 0) inquilinoCompletedFields++;
      if (inquilino.fechaUltimoRecibo) inquilinoCompletedFields++;
      if (inquilino.comprobanteTransferenciaVendedor && inquilino.comprobanteTransferenciaVendedor.length > 0) inquilinoCompletedFields++;
      if (inquilino.justificanteDeposito && inquilino.justificanteDeposito.length > 0) inquilinoCompletedFields++;
      if (inquilino.fechaVencimientoSeguroAlquiler) inquilinoCompletedFields++;
      if (inquilino.estadoSeguroAlquiler) inquilinoCompletedFields++;
      if (inquilino.proveedorSeguroAlquiler) inquilinoCompletedFields++;
    }
    
    sections.push({
      sectionId: "datos-inquilino",
      name: translations?.property.sections.tenantData || "Datos del inquilino",
      progress: inquilinoProgress,
      requiredFieldsCount: inquilinoRequiredFields,
      completedRequiredFieldsCount: inquilinoCompletedFields,
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
  }

  // Add checklist sections
  if (checklist && checklist.sections) {
    const checklistSections = checklist.sections;
    
    const entornoProgress = calculateEntornoZonasComunesProgress(checklistSections["entorno-zonas-comunes"]);
    
    sections.push({
      sectionId: "entorno-zonas-comunes",
      name: translations?.sidebar.entrance || "Entorno y zonas comunes",
      progress: entornoProgress,
      requiredFieldsCount: 8, // 3 upload zones + 5 questions
      completedRequiredFieldsCount: Math.round((entornoProgress / 100) * 8),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const estadoGeneralProgress = calculateEstadoGeneralProgress(checklistSections["estado-general"]);
    sections.push({
      sectionId: "estado-general",
      name: translations?.sidebar.distribution || "Estado general",
      progress: estadoGeneralProgress,
      requiredFieldsCount: 7, // 1 upload zone + 2 questions + 4 climatization items
      completedRequiredFieldsCount: Math.round((estadoGeneralProgress / 100) * 7),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const entradaPasillosProgress = calculateEntradaPasillosProgress(checklistSections["entrada-pasillos"]);
    const entradaPasillosRequired = 9 + (checklistSections["entrada-pasillos"]?.mobiliario?.existeMobiliario ? 1 : 0);
    sections.push({
      sectionId: "entrada-pasillos",
      name: translations?.sidebar.entrance || "Entrada y pasillos",
      progress: entradaPasillosProgress,
      requiredFieldsCount: entradaPasillosRequired,
      completedRequiredFieldsCount: Math.round((entradaPasillosProgress / 100) * entradaPasillosRequired),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const habitacionesProgress = calculateHabitacionesProgress(checklistSections["habitaciones"]);
    const habitacionesCount = checklistSections["habitaciones"]?.dynamicCount || 0;
    const habitacionesRequired = habitacionesCount * 9; // Per habitación: 9 required fields
    sections.push({
      sectionId: "habitaciones",
      name: translations?.sidebar.rooms || "Habitaciones",
      progress: habitacionesProgress,
      requiredFieldsCount: habitacionesRequired,
      completedRequiredFieldsCount: Math.round((habitacionesProgress / 100) * habitacionesRequired),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const salonProgress = calculateSalonProgress(checklistSections["salon"]);
    const salonRequired = 9 + (checklistSections["salon"]?.mobiliario?.existeMobiliario ? 1 : 0);
    sections.push({
      sectionId: "salon",
      name: translations?.sidebar.livingRoom || "Salón",
      progress: salonProgress,
      requiredFieldsCount: salonRequired,
      completedRequiredFieldsCount: Math.round((salonProgress / 100) * salonRequired),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const banosProgress = calculateBanosProgress(checklistSections["banos"]);
    const banosCount = checklistSections["banos"]?.dynamicCount || 0;
    const banosRequired = banosCount * 10; // Per baño: 10 required fields
    sections.push({
      sectionId: "banos",
      name: translations?.sidebar.bathrooms || "Baños",
      progress: banosProgress,
      requiredFieldsCount: banosRequired,
      completedRequiredFieldsCount: Math.round((banosProgress / 100) * banosRequired),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const cocinaProgress = calculateCocinaProgress(checklistSections["cocina"]);
    sections.push({
      sectionId: "cocina",
      name: translations?.sidebar.kitchen || "Cocina",
      progress: cocinaProgress,
      requiredFieldsCount: 16, // 1 upload zone + 3 questions + 2 carpentry + 2 storage + 8 appliances
      completedRequiredFieldsCount: Math.round((cocinaProgress / 100) * 16),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
    
    const exterioresProgress = calculateExterioresProgress(checklistSections["exteriores"]);
    sections.push({
      sectionId: "exteriores",
      name: translations?.sidebar.exterior || "Exteriores",
      progress: exterioresProgress,
      requiredFieldsCount: 7, // 1 upload zone + 2 questions + 2 security + 2 systems
      completedRequiredFieldsCount: Math.round((exterioresProgress / 100) * 7),
      optionalFieldsCount: 0,
      completedOptionalFieldsCount: 0,
    });
  } else {
    // Add empty checklist sections if checklist doesn't exist
    sections.push(
      { sectionId: "entorno-zonas-comunes", name: translations?.sidebar.entrance || "Entorno y zonas comunes", progress: 0, requiredFieldsCount: 3, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "estado-general", name: translations?.sidebar.distribution || "Estado general", progress: 0, requiredFieldsCount: 1, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "entrada-pasillos", name: translations?.sidebar.entrance || "Entrada y pasillos", progress: 0, requiredFieldsCount: 1, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "habitaciones", name: translations?.sidebar.rooms || "Habitaciones", progress: 0, requiredFieldsCount: 0, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "salon", name: translations?.sidebar.livingRoom || "Salón", progress: 0, requiredFieldsCount: 1, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "banos", name: translations?.sidebar.bathrooms || "Baños", progress: 0, requiredFieldsCount: 0, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "cocina", name: translations?.sidebar.kitchen || "Cocina", progress: 0, requiredFieldsCount: 1, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 },
      { sectionId: "exteriores", name: translations?.sidebar.exterior || "Exteriores", progress: 0, requiredFieldsCount: 1, completedRequiredFieldsCount: 0, optionalFieldsCount: 0, completedOptionalFieldsCount: 0 }
    );
  }

  return sections;
}

// Validate if property can be submitted for review
export function validateForSubmission(
  data?: PropertyData, 
  showInquilino?: boolean,
  checklist?: ChecklistData
): ValidationResult {
  if (!data) {
    return {
      isValid: false,
      missingFields: ["Datos de la propiedad no encontrados"],
    };
  }
  
  const missing: string[] = [];
  
  // Información de la propiedad - required fields
  if (!data.tipoPropiedad) missing.push("Tipo de propiedad");
  if (!data.superficieConstruida) missing.push("Superficie construida");
  if (!data.anoConstruccion) missing.push("Año de construcción");
  if (!data.referenciaCatastral) missing.push("Referencia Catastral");
  if (!data.orientacion || data.orientacion.length === 0) missing.push("Orientación");
  
  // Información económica - required fields
  // Only precioVenta, gastosComunidad, and ibiAnual are required
  // confirmacionGastosComunidad and confirmacionIBI are optional checkboxes
  if (!data.precioVenta) missing.push("Precio de venta");
  if (!data.gastosComunidad) missing.push("Gastos de comunidad mensuales");
  if (!data.ibiAnual) missing.push("IBI Anual");
  
  // Estado legal y de comunidad - required fields
  if (data.comunidadPropietariosConstituida === undefined) {
    missing.push("Comunidad de propietarios constituida");
  }
  if (data.edificioSeguroActivo === undefined) {
    missing.push("El edificio tiene seguro activo");
  }
  if (data.comercializaExclusiva === undefined) {
    missing.push("PropHero se comercializa en exclusiva");
  }
  if (data.edificioITEfavorable === undefined) {
    missing.push("El edificio tiene una ITE favorable en vigor");
  }
  if (data.propiedadAlquilada === undefined) {
    missing.push("La propiedad está actualmente alquilada");
  }
  if (data.propiedadAlquilada === true && !data.situacionInquilinos) {
    missing.push("Situación de los inquilinos tras la compra");
  }
  
  // Documentación mínima - all fields are optional now (videoGeneral removed)
  // EXCLUDED: Datos del Vendedor, Datos del Inquilino, certificadoEnergetico, notaSimpleRegistro, videoGeneral
  // These are optional for submission
  
  // Validate checklist
  const checklistValidation = validateChecklist(checklist);
  const missingSections = checklistValidation.missingSections;
  
  return {
    isValid: missing.length === 0 && checklistValidation.isValid,
    missingFields: missing,
    missingSections: missingSections.length > 0 ? missingSections : undefined,
  };
}

// Validate if property is complete (excluding: vendedor data, inquilino data, certificadoEnergetico, notaSimpleRegistro)
// This determines if a property should move from "draft" to "in-review"
// Now also validates checklist sections (all 8 sections must be complete)
export function validatePropertyComplete(
  data?: PropertyData, 
  propertyType?: string,
  checklist?: ChecklistData
): boolean {
  if (!data && !propertyType) return false;
  
  // Use propertyType from Property if tipoPropiedad is not in data
  const tipoPropiedad = data?.tipoPropiedad || propertyType;
  
  // Información de la propiedad - required fields
  if (!tipoPropiedad) return false;
  if (!data?.superficieConstruida) return false;
  if (!data?.anoConstruccion) return false;
  if (!data?.referenciaCatastral) return false;
  // Orientación: at least one selection is required
  if (!data?.orientacion || data.orientacion.length === 0) return false;
  
  // Optional numeric fields: 0 counts as complete (no need to interact)
  // habitaciones, banos, plazasAparcamiento are optional and 0 is valid
  // Checkboxes: ascensor, balconTerraza, trastero are optional and false is valid
  // Superficie útil is completely optional and doesn't affect completion
  
  // Información económica - required fields
  // Only precioVenta, gastosComunidad, and ibiAnual are required
  // confirmacionGastosComunidad and confirmacionIBI are optional checkboxes
  if (!data?.precioVenta) return false;
  if (!data?.gastosComunidad) return false;
  if (!data?.ibiAnual) return false;
  
  // Estado legal y de comunidad - required fields
  if (data.comunidadPropietariosConstituida === undefined) return false;
  if (data.edificioSeguroActivo === undefined) return false;
  if (data.comercializaExclusiva === undefined) return false;
  if (data.edificioITEfavorable === undefined) return false;
  if (data.propiedadAlquilada === undefined) return false;
  if (data.propiedadAlquilada === true && !data.situacionInquilinos) return false;
  
  // Documentación mínima - all fields are optional now (videoGeneral removed)
  // EXCLUDED: Datos del Vendedor, Datos del Inquilino, certificadoEnergetico, notaSimpleRegistro, videoGeneral
  
  // Checklist validation - all 8 sections must be complete
  if (checklist && checklist.sections) {
    if (!validateEntornoZonasComunes(checklist.sections["entorno-zonas-comunes"])) return false;
    if (!validateEstadoGeneral(checklist.sections["estado-general"])) return false;
    if (!validateEntradaPasillos(checklist.sections["entrada-pasillos"])) return false;
    if (!validateHabitaciones(checklist.sections["habitaciones"])) return false;
    if (!validateSalon(checklist.sections["salon"])) return false;
    if (!validateBanos(checklist.sections["banos"])) return false;
    if (!validateCocina(checklist.sections["cocina"])) return false;
    if (!validateExteriores(checklist.sections["exteriores"])) return false;
  } else {
    // If checklist is required but not provided, property is not complete
    return false;
  }
  
  return true;
}

// ============================================
// CHECKLIST VALIDATION FUNCTIONS
// ============================================

// Helper function to check if a status requires notes/photos
function requiresNotesOrPhotos(status?: ChecklistStatus): boolean {
  return status === "necesita_reparacion" || status === "necesita_reemplazo";
}

// Helper function to check if a status is "no_aplica"
function isNotApplicable(status?: ChecklistStatus): boolean {
  return status === "no_aplica";
}

// Helper function to validate upload zone (at least one photo or video required)
function validateUploadZone(uploadZone?: ChecklistUploadZone): boolean {
  if (!uploadZone) return false;
  return (uploadZone.photos && uploadZone.photos.length > 0) || 
         (uploadZone.videos && uploadZone.videos.length > 0);
}

// Helper function to validate question with status
function validateQuestion(question?: ChecklistQuestion, requireMainPhotos: boolean = true): boolean {
  if (!question) return false;
  
  // If no status, invalid
  if (!question.status) return false;
  
  // If "no_aplica", it's valid (no notes/photos required)
  if (isNotApplicable(question.status)) return true;
  
  // If requires notes/photos and status is "necesita_reparacion" or "necesita_reemplazo"
  if (requiresNotesOrPhotos(question.status)) {
    // Must have notes
    if (!question.notes || question.notes.trim() === "") return false;
    // Must have at least one photo if requireMainPhotos is true
    if (requireMainPhotos && (!question.photos || question.photos.length === 0)) return false;
  }
  
  // For "buen_estado", no notes/photos required, just status is enough
  return true;
}

// Helper function to validate carpentry/climatization item
function validateCarpentryItem(item: ChecklistCarpentryItem | ChecklistClimatizationItem | ChecklistStorageItem | ChecklistApplianceItem): boolean {
  // Contador en 0 cuenta como completo (el usuario ha interactuado con el contador)
  if (item.cantidad === 0) return true;
  
  // Si cantidad > 1, debe tener units
  if (item.cantidad > 1) {
    if (!item.units || item.units.length !== item.cantidad) return false;
    // Cada unit debe ser válido
    return item.units.every(unit => {
      if (!unit.estado) return false;
      if (isNotApplicable(unit.estado)) return true;
      if (requiresNotesOrPhotos(unit.estado)) {
        if (!unit.notes || unit.notes.trim() === "") return false;
        if (!unit.photos || unit.photos.length === 0) return false;
      }
      return true;
    });
  }
  
  // Si cantidad = 1, debe tener estado
  if (!item.estado) return false;
  if (isNotApplicable(item.estado)) return true;
  if (requiresNotesOrPhotos(item.estado)) {
    if (!item.notes || item.notes.trim() === "") return false;
    if (!item.photos || item.photos.length === 0) return false;
  }
  
  return true;
}

// Helper function to validate security/system item
function validateSecurityItem(item: ChecklistSecurityItem | ChecklistSystemItem): boolean {
  // Contador en 0 cuenta como completo
  if (item.cantidad === 0) return true;
  
  // Si cantidad > 1, debe tener units
  if (item.cantidad > 1) {
    if (!item.units || item.units.length !== item.cantidad) return false;
    // Cada unit debe ser válido
    return item.units.every(unit => {
      if (!unit.estado) return false;
      if (isNotApplicable(unit.estado)) return true;
      if (requiresNotesOrPhotos(unit.estado)) {
        if (!unit.notes || unit.notes.trim() === "") return false;
        if (!unit.photos || unit.photos.length === 0) return false;
      }
      return true;
    });
  }
  
  // Si cantidad = 1, debe tener estado
  if (!item.estado) return false;
  if (isNotApplicable(item.estado)) return true;
  if (requiresNotesOrPhotos(item.estado)) {
    if (!item.notes || item.notes.trim() === "") return false;
    if (!item.photos || item.photos.length === 0) return false;
  }
  
  return true;
}

// Calculate progress for "Entorno y zonas comunes" section (0-100)
function calculateEntornoZonasComunesProgress(section?: ChecklistSection): number {
  if (!section) {
    return 0;
  }
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  
  // Required: 3 upload zones (portal, fachada, entorno) + 5 questions (acceso-principal, acabados, comunicaciones, electricidad, carpinteria)
  const totalRequired: number = 8;
  let completed = 0;
  
  // Check upload zones (3 required)
  const requiredZoneIds = ["portal", "fachada", "entorno"];
  requiredZoneIds.forEach(zoneId => {
    const zone = uploadZones.find(z => z.id === zoneId);
    const isValid = zone && validateUploadZone(zone);
    if (isValid) {
      completed++;
    }
  });
  
  // Check questions (5 required - all must have status)
  const requiredQuestionIds = ["acceso-principal", "acabados", "comunicaciones", "electricidad", "carpinteria"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    const hasStatus = question && question.status;
    if (hasStatus) {
      completed++;
    }
  });
  
  const progress = totalRequired === 0 ? 0 : Math.round((completed / totalRequired) * 100);
  
  return progress;
}

// Validate "Entorno y zonas comunes" section (100% complete)
function validateEntornoZonasComunes(section?: ChecklistSection): boolean {
  return calculateEntornoZonasComunesProgress(section) === 100;
}

// Calculate progress for "Estado general" section (0-100)
function calculateEstadoGeneralProgress(section?: ChecklistSection): number {
  if (!section) return 0;
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  const climatizationItems = section.climatizationItems || [];
  
  // Required: 1 upload zone (perspectiva-general) + 2 questions (acabados, electricidad) + 4 climatization items
  const totalRequired: number = 7;
  let completed = 0;
  
  // Check main upload zone (1 required)
  if (uploadZones.length > 0 && validateUploadZone(uploadZones[0])) {
    completed++;
  }
  
  // Check questions (2 required - all must have status)
  const requiredQuestionIds = ["acabados", "electricidad"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.status) {
      completed++;
    }
  });
  
  // Check climatization items (4 required - all must be valid)
  const requiredClimatizationIds = ["radiadores", "split-ac", "calentador-agua", "calefaccion-conductos"];
  requiredClimatizationIds.forEach(itemId => {
    const item = climatizationItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((completed / totalRequired) * 100);
}

// Validate "Estado general" section (100% complete)
function validateEstadoGeneral(section?: ChecklistSection): boolean {
  return calculateEstadoGeneralProgress(section) === 100;
}

// Calculate progress for "Entrada y pasillos" section (0-100)
function calculateEntradaPasillosProgress(section?: ChecklistSection): number {
  if (!section) return 0;
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  const carpentryItems = section.carpentryItems || [];
  const climatizationItems = section.climatizationItems || [];
  
  // Required: 2 upload zones + 2 questions (acabados, electricidad) + 3 carpentry items + 2 climatization items
  // Optional: mobiliario (only if existeMobiliario is true)
  let totalRequired = 9; // 2 + 2 + 3 + 2
  let completed = 0;
  
  // Check upload zones (2 required)
  const requiredZoneIds = ["cuadro-general-electrico", "entrada-vivienda-pasillos"];
  requiredZoneIds.forEach(zoneId => {
    const zone = uploadZones.find(z => z.id === zoneId);
    if (zone && validateUploadZone(zone)) {
      completed++;
    }
  });
  
  // Check questions (2 required - all must have status)
  const requiredQuestionIds = ["acabados", "electricidad"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.status) {
      completed++;
    }
  });
  
  // Check carpentry items (3 required - all must be valid)
  const requiredCarpentryIds = ["ventanas", "persianas", "armarios"];
  requiredCarpentryIds.forEach(itemId => {
    const item = carpentryItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check climatization items (2 required - all must be valid)
  const requiredClimatizationIds = ["radiadores", "split-ac"];
  requiredClimatizationIds.forEach(itemId => {
    const item = climatizationItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check mobiliario (optional - only if existeMobiliario is true)
  if (section.mobiliario?.existeMobiliario) {
    totalRequired++; // Add mobiliario to total
    const mobiliarioQuestion = section.mobiliario.question;
    if (mobiliarioQuestion?.status) {
      // If status is not "no_aplica", must have notes
      if (mobiliarioQuestion.status === "no_aplica" || 
          (mobiliarioQuestion.notes && mobiliarioQuestion.notes.trim() !== "")) {
        completed++;
      }
    }
  }
  
  if (totalRequired === 0) return 0;
  return Math.round((completed / totalRequired) * 100);
}

// Validate "Entrada y pasillos" section (100% complete)
function validateEntradaPasillos(section?: ChecklistSection): boolean {
  return calculateEntradaPasillosProgress(section) === 100;
}

// Calculate progress for "Habitaciones" section (0-100)
function calculateHabitacionesProgress(section?: ChecklistSection): number {
  if (!section || !section.dynamicCount || section.dynamicCount < 1) return 0;
  
  const dynamicItems = section.dynamicItems || [];
  if (dynamicItems.length !== section.dynamicCount) return 0;
  
  // Per habitación: 1 upload zone + 3 questions (acabados, electricidad, puerta-entrada) + 3 carpentry items + 2 climatization items
  // Optional: mobiliario (only if existeMobiliario is true)
  const requiredPerHabitacion = 9; // 1 + 3 + 3 + 2
  let totalRequired = section.dynamicCount * requiredPerHabitacion;
  let totalCompleted = 0;
  
  dynamicItems.forEach(item => {
    let habitacionCompleted = 0;
    
    // Upload zone (1 required)
    if (validateUploadZone(item.uploadZone)) {
      habitacionCompleted++;
    }
    
    // Questions (3 required - all must have status)
    const requiredQuestionIds = ["acabados", "electricidad", "puerta-entrada"];
    requiredQuestionIds.forEach(questionId => {
      const question = item.questions?.find(q => q.id === questionId);
      if (question && question.status) {
        habitacionCompleted++;
      }
    });
    
    // Carpentry items (3 required - all must be valid)
    const requiredCarpentryIds = ["ventanas", "persianas", "armarios"];
    requiredCarpentryIds.forEach(itemId => {
      const carpentryItem = item.carpentryItems?.find(i => i.id === itemId);
      if (carpentryItem && validateCarpentryItem(carpentryItem)) {
        habitacionCompleted++;
      }
    });
    
    // Climatization items (2 required - all must be valid)
    const requiredClimatizationIds = ["radiadores", "split-ac"];
    requiredClimatizationIds.forEach(itemId => {
      const climatizationItem = item.climatizationItems?.find(i => i.id === itemId);
      if (climatizationItem && validateCarpentryItem(climatizationItem)) {
        habitacionCompleted++;
      }
    });
    
    // Mobiliario (optional - only if existeMobiliario is true)
    if (item.mobiliario?.existeMobiliario) {
      totalRequired++; // Add mobiliario to total
      const mobiliarioQuestion = item.mobiliario.question;
      if (mobiliarioQuestion?.status) {
        if (mobiliarioQuestion.status === "no_aplica" || 
            (mobiliarioQuestion.notes && mobiliarioQuestion.notes.trim() !== "")) {
          habitacionCompleted++;
        }
      }
    }
    
    totalCompleted += habitacionCompleted;
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((totalCompleted / totalRequired) * 100);
}

// Validate "Habitaciones" section (100% complete)
function validateHabitaciones(section?: ChecklistSection): boolean {
  return calculateHabitacionesProgress(section) === 100;
}

// Calculate progress for "Salón" section (0-100)
function calculateSalonProgress(section?: ChecklistSection): number {
  if (!section) return 0;
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  const carpentryItems = section.carpentryItems || [];
  const climatizationItems = section.climatizationItems || [];
  
  // Required: 1 upload zone + 3 questions (acabados, electricidad, puerta-entrada) + 3 carpentry items + 2 climatization items
  // Optional: mobiliario (only if existeMobiliario is true)
  let totalRequired = 9; // 1 + 3 + 3 + 2
  let completed = 0;
  
  // Check upload zone (1 required)
  if (uploadZones.length > 0 && validateUploadZone(uploadZones[0])) {
    completed++;
  }
  
  // Check questions (3 required - all must have status)
  const requiredQuestionIds = ["acabados", "electricidad", "puerta-entrada"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.status) {
      completed++;
    }
  });
  
  // Check carpentry items (3 required - all must be valid)
  const requiredCarpentryIds = ["ventanas", "persianas", "armarios"];
  requiredCarpentryIds.forEach(itemId => {
    const item = carpentryItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check climatization items (2 required - all must be valid)
  const requiredClimatizationIds = ["radiadores", "split-ac"];
  requiredClimatizationIds.forEach(itemId => {
    const item = climatizationItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check mobiliario (optional - only if existeMobiliario is true)
  if (section.mobiliario?.existeMobiliario) {
    totalRequired++; // Add mobiliario to total
    const mobiliarioQuestion = section.mobiliario.question;
    if (mobiliarioQuestion?.status) {
      if (mobiliarioQuestion.status === "no_aplica" || 
          (mobiliarioQuestion.notes && mobiliarioQuestion.notes.trim() !== "")) {
        completed++;
      }
    }
  }
  
  if (totalRequired === 0) return 0;
  return Math.round((completed / totalRequired) * 100);
}

// Validate "Salón" section (100% complete)
function validateSalon(section?: ChecklistSection): boolean {
  return calculateSalonProgress(section) === 100;
}

// Calculate progress for "Baños" section (0-100)
function calculateBanosProgress(section?: ChecklistSection): number {
  if (!section || !section.dynamicCount || section.dynamicCount < 1) return 0;
  
  const dynamicItems = section.dynamicItems || [];
  if (dynamicItems.length !== section.dynamicCount) return 0;
  
  // Per baño: 1 upload zone + 7 questions (acabados, agua-drenaje, sanitarios, griferia-ducha, puerta-entrada, mobiliario, ventilacion) + 2 carpentry items
  const requiredPerBano = 10; // 1 + 7 + 2
  let totalRequired = section.dynamicCount * requiredPerBano;
  let totalCompleted = 0;
  
  dynamicItems.forEach(item => {
    let banoCompleted = 0;
    
    // Upload zone (1 required)
    if (validateUploadZone(item.uploadZone)) {
      banoCompleted++;
    }
    
    // Questions (7 required - all must have status)
    const requiredQuestionIds = ["acabados", "agua-drenaje", "sanitarios", "griferia-ducha", "puerta-entrada", "mobiliario", "ventilacion"];
    requiredQuestionIds.forEach(questionId => {
      const question = item.questions?.find(q => q.id === questionId);
      if (question && question.status) {
        banoCompleted++;
      }
    });
    
    // Carpentry items (2 required - all must be valid)
    const requiredCarpentryIds = ["ventanas", "persianas"];
    requiredCarpentryIds.forEach(itemId => {
      const carpentryItem = item.carpentryItems?.find(i => i.id === itemId);
      if (carpentryItem && validateCarpentryItem(carpentryItem)) {
        banoCompleted++;
      }
    });
    
    totalCompleted += banoCompleted;
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((totalCompleted / totalRequired) * 100);
}

// Validate "Baños" section (100% complete)
function validateBanos(section?: ChecklistSection): boolean {
  return calculateBanosProgress(section) === 100;
}

// Calculate progress for "Cocina" section (0-100)
function calculateCocinaProgress(section?: ChecklistSection): number {
  if (!section) return 0;
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  const carpentryItems = section.carpentryItems || [];
  const storageItems = section.storageItems || [];
  const appliancesItems = section.appliancesItems || [];
  
  // Required: 1 upload zone + 3 questions (acabados, mobiliario-fijo, agua-drenaje) + 2 carpentry items + 2 storage items + 8 appliances items
  const totalRequired: number = 16; // 1 + 3 + 2 + 2 + 8
  let completed = 0;
  
  // Check upload zone (1 required)
  if (uploadZones.length > 0 && validateUploadZone(uploadZones[0])) {
    completed++;
  }
  
  // Check questions (3 required - all must have status)
  const requiredQuestionIds = ["acabados", "mobiliario-fijo", "agua-drenaje"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.status) {
      completed++;
    }
  });
  
  // Check carpentry items (2 required - all must be valid)
  const requiredCarpentryIds = ["ventanas", "persianas"];
  requiredCarpentryIds.forEach(itemId => {
    const item = carpentryItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check storage items (2 required - all must be valid)
  const requiredStorageIds = ["armarios-despensa", "cuarto-lavado"];
  requiredStorageIds.forEach(itemId => {
    const item = storageItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  // Check appliances items (8 required - all must be valid)
  const requiredAppliancesIds = ["placa-gas", "placa-vitro-induccion", "campana-extractora", "horno", "nevera", "lavadora", "lavavajillas", "microondas"];
  requiredAppliancesIds.forEach(itemId => {
    const item = appliancesItems.find(i => i.id === itemId);
    if (item && validateCarpentryItem(item)) {
      completed++;
    }
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((completed / totalRequired) * 100);
}

// Validate "Cocina" section (100% complete)
function validateCocina(section?: ChecklistSection): boolean {
  return calculateCocinaProgress(section) === 100;
}

// Calculate progress for "Exteriores" section (0-100)
function calculateExterioresProgress(section?: ChecklistSection): number {
  if (!section) return 0;
  
  const uploadZones = section.uploadZones || [];
  const questions = section.questions || [];
  const securityItems = section.securityItems || [];
  const systemsItems = section.systemsItems || [];
  
  // Required: 1 upload zone + 2 questions (acabados-exteriores, observaciones) + 2 security items + 2 systems items
  const totalRequired: number = 7; // 1 + 2 + 2 + 2
  let completed = 0;
  
  // Check upload zone (1 required)
  if (uploadZones.length > 0 && validateUploadZone(uploadZones[0])) {
    completed++;
  }
  
  // Check questions (2 required - all must have status)
  const requiredQuestionIds = ["acabados-exteriores", "observaciones"];
  requiredQuestionIds.forEach(questionId => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.status) {
      completed++;
    }
  });
  
  // Check security items (2 required - all must be valid)
  const requiredSecurityIds = ["barandillas", "rejas"];
  requiredSecurityIds.forEach(itemId => {
    const item = securityItems.find(i => i.id === itemId);
    if (item && validateSecurityItem(item)) {
      completed++;
    }
  });
  
  // Check systems items (2 required - all must be valid)
  const requiredSystemsIds = ["tendedero-exterior", "toldos"];
  requiredSystemsIds.forEach(itemId => {
    const item = systemsItems.find(i => i.id === itemId);
    if (item && validateSecurityItem(item)) {
      completed++;
    }
  });
  
  if (totalRequired === 0) return 0;
  return Math.round((completed / totalRequired) * 100);
}

// Validate "Exteriores" section (100% complete)
function validateExteriores(section?: ChecklistSection): boolean {
  return calculateExterioresProgress(section) === 100;
}

// Validate all checklist sections
export function validateChecklist(checklist?: ChecklistData): { isValid: boolean; missingSections: string[] } {
  if (!checklist || !checklist.sections) {
    return {
      isValid: false,
      missingSections: [
        "Entorno y zonas comunes",
        "Estado general",
        "Entrada y pasillos",
        "Habitaciones",
        "Salón",
        "Baños",
        "Cocina",
        "Exteriores"
      ]
    };
  }
  
  const sections = checklist.sections;
  const missingSections: string[] = [];
  
  // Validate each section
  if (!validateEntornoZonasComunes(sections["entorno-zonas-comunes"])) {
    missingSections.push("Entorno y zonas comunes");
  }
  
  if (!validateEstadoGeneral(sections["estado-general"])) {
    missingSections.push("Estado general");
  }
  
  if (!validateEntradaPasillos(sections["entrada-pasillos"])) {
    missingSections.push("Entrada y pasillos");
  }
  
  if (!validateHabitaciones(sections["habitaciones"])) {
    missingSections.push("Habitaciones");
  }
  
  if (!validateSalon(sections["salon"])) {
    missingSections.push("Salón");
  }
  
  if (!validateBanos(sections["banos"])) {
    missingSections.push("Baños");
  }
  
  if (!validateCocina(sections["cocina"])) {
    missingSections.push("Cocina");
  }
  
  if (!validateExteriores(sections["exteriores"])) {
    missingSections.push("Exteriores");
  }
  
  return {
    isValid: missingSections.length === 0,
    missingSections
  };
}
