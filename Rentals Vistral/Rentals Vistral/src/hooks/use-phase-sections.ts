"use client";

/**
 * Hook to get sections configuration based on the current phase.
 * This provides a centralized way to get sections for PhaseTransitionWidget validation.
 */
export function usePhaseSections(currentPhase: string) {
  // Sections for "Viviendas Prophero" phase - Fase 1
  const propheroSections = [
    {
      id: "property-management-info",
      title: "Información de Gestión de la Propiedad",
      instructions: "Verifica que la información de administración y acceso esté completa",
      required: true,
      fields: [
        { id: "admin_name", type: "text", label: "Administrador de la propiedad", required: true },
        { id: "keys_location", type: "text", label: "Localización de las llaves", required: true },
      ],
    },
    {
      id: "technical-documents",
      title: "Documentos Técnicos de la Propiedad",
      instructions: "Sube los documentos técnicos requeridos",
      required: true,
      fields: [
        { id: "doc_energy_cert", type: "document", label: "Certificado de eficiencia energética", required: true },
        { id: "doc_renovation_files", type: "document", label: "Documentos de la reforma", required: true },
      ],
    },
    {
      id: "legal-documents",
      title: "Documentos Legales de la Propiedad",
      instructions: "Sube los documentos legales que acreditan la propiedad",
      required: true,
      fields: [
        { id: "doc_purchase_contract", type: "document", label: "Contrato de compraventa de la propiedad", required: true },
        { id: "doc_land_registry_note", type: "document", label: "Nota Simple de la propiedad", required: true },
      ],
    },
    {
      id: "client-financial-info",
      title: "Información Financiera del Cliente",
      instructions: "Verifica que los datos bancarios estén completos",
      required: true,
      fields: [
        { id: "client_iban", type: "text", label: "Cuenta bancaria del propietario", required: true },
        { id: "client_bank_certificate_url", type: "document", label: "Certificado de titularidad bancaria", required: true },
      ],
    },
    {
      id: "supplies-contracts",
      title: "Contratos de Suministros",
      instructions: "Sube los contratos de servicios básicos",
      required: true,
      fields: [
        { id: "doc_contract_electricity", type: "document", label: "Contrato Electricidad", required: true },
        { id: "doc_contract_water", type: "document", label: "Contrato Agua", required: true },
        { id: "doc_contract_gas", type: "document", label: "Contrato Gas", required: true },
      ],
    },
    {
      id: "supplies-bills",
      title: "Facturas de Suministros",
      instructions: "Sube las facturas recientes de los suministros",
      required: true,
      fields: [
        { id: "doc_bill_electricity", type: "document", label: "Factura Electricidad", required: true },
        { id: "doc_bill_water", type: "document", label: "Factura Agua", required: true },
        { id: "doc_bill_gas", type: "document", label: "Factura Gas", required: true },
      ],
    },
    {
      id: "home-insurance",
      title: "Seguro de Hogar",
      instructions: "Verifica que la información del seguro esté completa",
      required: true,
      fields: [
        { id: "home_insurance_type", type: "select", label: "Tipo de Seguro de Hogar", required: true },
        { id: "home_insurance_policy_url", type: "document", label: "Póliza del Seguro de Hogar", required: true },
      ],
    },
    {
      id: "property-management",
      title: "Gestión de Propiedad (Property Management)",
      instructions: "Verifica que el plan de gestión esté configurado",
      required: true,
      fields: [
        { id: "property_management_plan", type: "select", label: "Plan PM", required: true },
        { id: "property_management_plan_contract_url", type: "document", label: "Contrato Property Management", required: true },
        { id: "property_manager", type: "text", label: "Property Manager asignado", required: true },
      ],
    },
  ];

  // Default sections for other phases (legacy)
  const defaultSections = [
    {
      id: "personal-info",
      title: "Datos de Contacto",
      instructions: "Verifica que el teléfono tenga prefijo internacional",
      required: true,
      fields: [
        { id: "fullName", type: "text", label: "Nombre completo", required: true },
        { id: "email", type: "email", label: "Correo electrónico", required: true },
        { id: "phone", type: "phone", label: "Teléfono", required: true },
        { id: "nif", type: "nif", label: "DNI/NIE", required: true },
      ],
    },
    {
      id: "documents",
      title: "Documentación",
      instructions: "Sube los documentos requeridos",
      required: true,
      fields: [
        { id: "contract", type: "document", label: "Contrato", required: true },
        { id: "notes", type: "textarea", label: "Notas adicionales", required: false },
      ],
    },
    {
      id: "checklist",
      title: "Checklist de Verificación",
      instructions: "Marca todos los elementos verificados",
      required: false,
      fields: [
        { id: "verified", type: "checklist", label: "Elementos verificados", required: false },
        { id: "type", type: "select", label: "Tipo de verificación", required: false },
        { id: "amount", type: "currency", label: "Monto", required: false },
        { id: "date", type: "date", label: "Fecha", required: false },
      ],
    },
  ];

  // Sections for "Listo para Alquilar" phase - Fase 2
  const readyToRentSections = [
    {
      id: "client-presentation",
      title: "Presentación al Cliente",
      instructions: "Confirma el contacto inicial y alineación con el propietario",
      required: true,
      fields: [
        { id: "client_presentation_done", type: "radio", label: "¿Se ha realizado la presentación del servicio al cliente?", required: true },
        { id: "client_presentation_date", type: "date", label: "Fecha de Presentación", required: true },
        { id: "client_presentation_channel", type: "radio", label: "Canal de Comunicación", required: true },
      ],
    },
    {
      id: "pricing-strategy",
      title: "Estrategia de Precio",
      instructions: "Define y aprueba el precio de salida al mercado",
      required: true,
      fields: [
        { id: "announcement_price", type: "number", label: "Precio de Publicación", required: true },
        { id: "price_approval", type: "radio", label: "¿Ha aprobado el cliente este precio de publicación?", required: true },
      ],
    },
    {
      id: "technical-inspection",
      title: "Inspección Técnica y Reportaje",
      instructions: "Evalúa cada estancia/zona de la propiedad. Valida su estado y sube las fotos comerciales.",
      required: true,
      fields: [
        { id: "check_common_areas", type: "select", label: "Estado de estancias", required: true },
        { id: "marketing_photos_common_areas", type: "document", label: "Fotos comerciales", required: true },
        { id: "incident_photos_common_areas", type: "document", label: "Fotos de incidencias", required: false },
      ],
    },
    {
      id: "commercial-launch",
      title: "Lanzamiento Comercial",
      instructions: "Configuración final y activación del anuncio",
      required: true,
      fields: [
        { id: "publish_online", type: "radio", label: "¿Se publicará la propiedad en portales inmobiliarios?", required: true },
        { id: "idealista_description", type: "textarea", label: "Descripción del Inmueble para el Anuncio", required: false },
      ],
    },
  ];

  // Return phase-specific sections
  const sections = 
    currentPhase === "Viviendas Prophero" ? propheroSections :
    currentPhase === "Listo para Alquilar" ? readyToRentSections :
    defaultSections;

  const requiredSections = sections.filter((s) => s.required);
  const allSections = sections;

  return {
    sections,
    requiredSections,
    allSections,
  };
}
