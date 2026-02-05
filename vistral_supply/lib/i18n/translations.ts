export type Language = "es" | "en";

export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    continue: string;
    back: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    yes: string;
    no: string;
  };
  
  // Navigation
  nav: {
    home: string;
    kanban: string;
    properties: string;
    proyecto: string;
    notifications: string;
    help: string;
    logout: string;
  };
  
  // Theme
  theme: {
    light: string;
    dark: string;
    auto: string;
    system: string;
  };
  
  // Language
  language: {
    spanish: string;
    english: string;
  };
  
  // User Menu
  userMenu: {
    theme: string;
    language: string;
    settings: string;
    changePassword: {
      title: string;
      description: string;
      menuItem: string;
      currentPassword: string;
      currentPasswordPlaceholder: string;
      newPassword: string;
      newPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      updateButton: string;
      updating: string;
      success: string;
      errors: {
        allFieldsRequired: string;
        passwordTooShort: string;
        passwordsDoNotMatch: string;
        samePassword: string;
        currentPasswordIncorrect: string;
        userNotFound: string;
        generic: string;
      };
    };
  };
  
  // Roles
  roles: {
    supply_partner: string;
    supply_analyst: string;
    supply_admin: string;
    supply_lead?: string;
    reno_lead?: string;
    renovator_analyst?: string;
    scouter?: string;
    supply_project_analyst?: string;
    supply_project_lead?: string;
  };
  
  // Property
  property: {
    title: string;
    management: string;
    addNew: string;
    edit: string;
    delete: string;
    save: string;
    submitReview: string;
    fullAddress: string;
    propertyType: string;
    renovationType: string;
    gallery: string;
    viewAll: string;
    noImagesAvailable: string;
    couldNotLoadImage: string;
    photo: string;
    photos: string;
    saveSuccess: string;
    trackingEnabled: string;
    trackingDisabled: string;
    trackingError: string;
    sections: {
      basicInfo: string;
      economicInfo: string;
      legalStatus: string;
      documentation: string;
      sellerData: string;
      sellerDataDescription: string;
      tenantData: string;
      tenantDataDescription: string;
      nextSection: string;
    };
  };
  
  // Login
  login: {
    title: string;
    subtitle: string;
    secureLoginButton: string;
    createAccount: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    loggingIn: string;
    forgotPassword: string;
    support: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
  
  // Kanban
  kanban: {
    draft: string;
    inReview: string;
    needsCorrection: string;
    inNegotiation: string;
    arras: string;
    pendingToSettlement: string;
    settlement: string;
    sold: string;
    rejected: string;
    // Supply Analyst phases
    backlog: string;
    underReview: string;
    renovationEstimation: string;
    financialAnalysis: string;
    done: string;
    // Reno phases
    pending: string;
    inProgress: string;
    completed: string;
    searchPlaceholder: string;
    noPropertiesFound: string;
    addProperty: string;
    filterProperties: string;
  };
  
  // Messages
  messages: {
    loading: string;
    notFound: string;
    error: string;
    saveSuccess: string;
    saveError: string;
    submitSuccess: string;
    submitError: string;
    deleteConfirm: string;
    deleteConfirmDescription: string;
    completeRequiredFields: string;
    backToKanban: string;
  };
  
  // Section Info
    sectionInfo: {
      requiredFields: string;
      requiredFieldsDescription: string;
      requiredDocuments: string;
      requiredDocumentsDescription: string;
      optionalFields: string;
      optionalFieldsDescription: string;
    };
    
  // Form labels and placeholders
  formLabels: {
    onlyRequiredForPublishing: string;
    indicateIfPropertyHas: string;
    confirmExactAmount: string;
    confirmExactAmountIBI: string;
    confirmExactAmountCommunity: string;
    example: string;
    required: string;
    optional: string;
    streetNumber: string;
    floor: string;
    block: string;
    door: string;
    staircase: string;
    selectOption: string;
    files: string;
    dragDropFiles: string;
    maxFileSize: string;
    maxFilesInfo: string;
    photo: string;
    video: string;
    cameraNotAvailable: string;
    cameraAccessError: string;
  };
  
  // Property field labels
  propertyFields: {
    propertyType: string;
    builtArea: string;
    usefulArea: string;
    squareMeters: string;
    constructionYear: string;
    cadastralReference: string;
    orientation: string;
    orientationOptions: {
      norte: string;
      sur: string;
      este: string;
      oeste: string;
    };
    bedrooms: string;
    bathrooms: string;
    parkingSpots: string;
    elevator: string;
    balconyTerrace: string;
    storage: string;
    salePrice: string;
    monthlyCommunityFees: string;
    annualIBI: string;
    confirmCommunityFees: string;
    confirmIBI: string;
    communityConstituted: string;
    communityConstitutedDescription: string;
    buildingInsuranceActive: string;
    buildingInsuranceActiveDescription: string;
    exclusiveMarketing: string;
    exclusiveMarketingDescription: string;
    favorableITE: string;
    favorableITEDescription: string;
    propertyRented: string;
    propertyRentedDescription: string;
    tenantSituation: string;
    tenantSituationOptions: {
      tenantsRemain: string;
      propertyWillBeDeliveredFree: string;
      illegallyOccupied: string;
    };
    generalVideo: string;
    generalVideoDescription: string;
    notaSimple: string;
    notaSimpleDescription: string;
    energyCertificate: string;
    energyCertificateDescription: string;
  };
  
  // Tenant fields
  tenantFields: {
    fullName: string;
    email: string;
    phoneNumber: string;
    dniNie: string;
    dniNieDescription: string;
    rentalContract: string;
    rentalContractDescription: string;
    contractEndDate: string;
    noticePeriod: string;
    days: string;
    contractSubrogation: string;
    subrogationOptions: {
      withSubrogation: string;
      withoutSubrogation: string;
    };
    rentalAmountToTransfer: string;
    perMonth: string;
    lastRentalUpdate: string;
    paymentProofs: string;
    paymentProofsDescription: string;
    lastReceiptDate: string;
    rentalTransferProof: string;
    rentalTransferProofDescription: string;
    depositProof: string;
    depositProofDescription: string;
    rentalInsuranceExpiryDate: string;
    rentalInsuranceStatus: string;
    insuranceStatusOptions: {
      inForce: string;
      expired: string;
    };
    rentalInsuranceProvider: string;
    rentalInsuranceProviderPlaceholder: string;
    contractTermsAndConditions: string;
    paymentManagementAndSettlement: string;
    rentalCoverageAndInsurance: string;
  };
  
  // Seller fields
  sellerFields: {
    numberOfOwners: string;
    owner: string;
    fullNameOrLegalName: string;
    fullNameOrLegalNamePlaceholder: string;
    identityDocumentNumber: string;
    identityDocumentNumberPlaceholder: string;
    identityDocumentNumberDescription: string;
    dniNifCif: string;
    dniNifCifDescription: string;
    email: string;
    phoneNumber: string;
    incrementQuantity: string;
    decrementQuantity: string;
  };
  
  // Section messages
  sectionMessages: {
    tenantSectionUnavailable: string;
    sectionInDevelopment: string;
  };
  
  // UI Labels
  labels: {
    completed: string;
  };
  
  // Property Detail Page
  propertyDetail: {
    title: string;
    editProperty: string;
    propertyId: string;
    cadastralReference: string;
    tabs: {
      overview: string;
      condition: string;
      documents: string;
      contacts: string;
      rental: string;
      financial: string;
    };
    status: {
      draft: string;
      underReview: string;
      needsCorrection: string;
      financialAnalysis: string;
      renovationEstimation: string;
      inNegotiation: string;
      arras: string;
      settlement: string;
      sold: string;
      rejected: string;
      lastChange: string;
      partner: string;
      supplyAnalyst: string;
      awaitingAssignment: string;
      propertyCreatedOn: string;
      lessThanAnHour: string;
      day: string;
      days: string;
      hour: string;
      hours: string;
    };
    overview: {
      showAllPhotos: string;
      propertyInformation: string;
      basicFeatures: string;
      buildingFeatures: string;
      economicInformation: string;
      legalAndCommunityStatus: string;
      documentation: string;
      location: string;
      viewAll: string;
      orientation: string;
    };
    contacts: {
      propertyOwners: string;
      tenantInformation: string;
      seller: string;
      tenant: string;
      idNumber: string;
      email: string;
      phoneNumber: string;
      documents: string;
      noContacts: string;
    };
    rental: {
      notRented: string;
      noTenantData: string;
    };
    corrections: {
      title: string;
      saveCorrections: string;
      viewCorrections: string;
      addNew: string;
      noCorrections: string;
      category: string;
      subcategory: string;
      description: string;
      status: string;
      createdBy: string;
      resolvedBy: string;
      approvedBy: string;
      createdAt: string;
      resolvedAt: string;
      approvedAt: string;
      pending: string;
      resolved: string;
      approved: string;
      resolve: string;
      approve: string;
      delete: string;
      addCorrection: string;
      cancel: string;
      selectCategory: string;
      selectSubcategory: string;
      descriptionPlaceholder: string;
      categories: {
        overview: string;
        condition: string;
        documents: string;
        contacts: string;
        rental: string;
      };
      subcategories: {
        overview: {
          propertyInformation: string;
          economicInformation: string;
          legalAndCommunityStatus: string;
          documentation: string;
          location: string;
        };
        condition: {
          generalCondition: string;
          specificSections: string;
        };
        documents: {
          missingDocuments: string;
          documentQualityIssues: string;
        };
        contacts: {
          sellerData: string;
          tenantData: string;
        };
        rental: {
          contractTerms: string;
          paymentInformation: string;
          insuranceInformation: string;
        };
      };
      saving: string;
      savedSuccessfully: string;
      errorSaving: string;
      errorCreating: string;
      errorUpdating: string;
      errorDeleting: string;
      confirmDelete: string;
      confirmDeleteDescription: string;
    };
    approveProperty: string;
    approving: string;
    makeFinancialEstimate: string;
  financialEstimate?: {
    noDetailsAvailable: string;
    continueUpload: string;
    saving: string;
    saveChanges: string;
    pageTitle: string;
    simulationTitle: string;
    simulationDescription: string;
    addFinancial: string;
    noDataToDisplay: string;
    addBasicInformation: string;
      basicInformation: {
        title: string;
        investmentAmount: string;
        recurringCosts: string;
        financing: string;
        scenarioDrivers: string;
        purchasePrice: string;
        closingCosts: string;
        monthlyRent: string;
        propertyManagementPlan: string;
        ltv: string;
        loanTerm: string;
        interestRate: string;
        years: string;
        rentalVariationConservative: string;
        rentalVariationFavorable: string;
        occupancyRateConservative: string;
        occupancyRateFavorable: string;
        generateFinancial: string;
        regenerateFinancial: string;
      };
      profitabilityTable: {
        title: string;
        feasibilityConfirmed: string;
        thresholdNotReached: string;
        metric: string;
        conservativeScenario: string;
        favorableScenario: string;
        acquisitionCosts: string;
        salePrice: string;
        purchasePrice: string;
        deposit: string;
        taxes: string;
        closingCosts: string;
        feesAndCapes: string;
        renovationCost: string;
        furnishingCost: string;
        tenantSearchingFee: string;
        reAgentFee: string;
        propHeroFee: string;
        investmentTotals: string;
        totalInvestmentNonFinanced: string;
        totalInvestmentFinanced: string;
        income: string;
        grossMonthlyRent: string;
        grossAnnualRent: string;
        grossYield: string;
        operatingExpenses: string;
        communityFeesMonthly: string;
        homeInsuranceMonthly: string;
        ibiMonthly: string;
        propertyManagementMonthly: string;
        loanInterest: string;
        returnsAndYields: string;
        netMonthlyRentNoFinancing: string;
        netAnnualRentNoFinancing: string;
        netYieldNoFinancing: string;
        netMonthlyRentFinancing: string;
        netAnnualRentFinancing: string;
        netYieldFinancing: string;
      };
    };
  };
  
  // Sidebar
  sidebar: {
    basicData: string;
    ownerOccupation: string;
    statusCharacteristics: string;
    propertyInformation: string;
    platform: string;
    settings: string;
    configuration: string;
    entrance: string;
    distribution: string;
    rooms: string;
    livingRoom: string;
    bathrooms: string;
    kitchen: string;
    exterior: string;
    soon: string;
    user: string;
    users: string;
  };
  
  // Checklist
  checklist: {
    title: string;
    buenEstado: string;
    necesitaReparacion: string;
    necesitaReemplazo: string;
    noAplica: string;
    notes: string;
    mandatory: string;
    submitChecklist: string;
    submitChecklistDescription: string;
    submitting: string;
    observations: string;
    observationsDescription: string;
    photos: string;
    videos: string;
    whatElementsBadCondition: string;
    observationsPlaceholder: string;
    addPhotos: string;
    dragDropFiles?: string;
    clickToBrowse?: string;
    elements?: any;
    sections: {
      entornoZonasComunes: any;
      estadoGeneral: any;
      entradaPasillos: any;
      habitaciones: any;
      salon: any;
      banos: any;
      cocina: any;
      exteriores: any;
    };
  };
  financialEstimate?: {
    noDetailsAvailable: string;
    continueUpload: string;
    saving: string;
    saveChanges: string;
    saveFinancials?: string;
    pageTitle: string;
    addFinancial?: string;
    simulationTitle?: string;
    simulationDescription?: string;
    profitabilityTable?: {
      title?: string;
    };
    noDataToDisplay?: string;
    addBasicInformation?: string;
    basicInformation?: {
      title?: string;
      investmentAmount?: string;
      purchasePrice?: string;
      sellingPrice?: string;
      closingCosts?: string;
      recurringCosts?: string;
      monthlyRent?: string;
      propertyManagementPlan?: string;
      financing?: string;
      financingType?: string;
      loanTerm?: string;
      ltv?: string;
      years?: string;
      interestRate?: string;
      scenarioDrivers?: string;
      rentalVariationConservative?: string;
      rentalVariationFavorable?: string;
      occupancyRateConservative?: string;
      occupancyRateFavorable?: string;
      regenerateFinancial?: string;
      generateFinancial?: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      continue: "Continuar",
      back: "Volver",
      search: "Buscar",
      filter: "Filtrar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      yes: "Sí",
      no: "No",
    },
    nav: {
      home: "Inicio",
      kanban: "Gestión de propiedades",
      properties: "Propiedades",
      proyecto: "Proyecto",
      notifications: "Notificaciones",
      help: "Ayuda",
      logout: "Cerrar sesión",
    },
    theme: {
      light: "Claro",
      dark: "Oscuro",
      auto: "Automático",
      system: "Sistema",
    },
    language: {
      spanish: "Español",
      english: "Inglés",
    },
    userMenu: {
      theme: "Tema",
      language: "Idioma",
      settings: "Configuración",
      changePassword: {
        title: "Cambiar Contraseña",
        description: "Ingresa tu contraseña actual y la nueva contraseña para actualizar tu cuenta.",
        menuItem: "Cambiar Contraseña",
        currentPassword: "Contraseña Actual",
        currentPasswordPlaceholder: "Ingresa tu contraseña actual",
        newPassword: "Nueva Contraseña",
        newPasswordPlaceholder: "Ingresa tu nueva contraseña",
        confirmPassword: "Confirmar Contraseña",
        confirmPasswordPlaceholder: "Confirma tu nueva contraseña",
        updateButton: "Actualizar Contraseña",
        updating: "Actualizando...",
        success: "Contraseña actualizada exitosamente",
        errors: {
          allFieldsRequired: "Todos los campos son requeridos",
          passwordTooShort: "La contraseña debe tener al menos 6 caracteres",
          passwordsDoNotMatch: "Las contraseñas no coinciden",
          samePassword: "La nueva contraseña debe ser diferente a la actual",
          currentPasswordIncorrect: "La contraseña actual es incorrecta",
          userNotFound: "Usuario no encontrado",
          generic: "Error al cambiar la contraseña. Intenta nuevamente.",
        },
      },
    },
    roles: {
      supply_partner: "Socio de Suministro",
      supply_analyst: "Analista de Suministro",
      supply_admin: "Administrador de Suministro",
      supply_lead: "Lead Suministro",
      reno_lead: "Lead Reno",
      renovator_analyst: "Analista Reno",
      scouter: "Scouter",
      supply_project_analyst: "Analista de Proyecto",
      supply_project_lead: "Lead de Proyecto",
    },
    property: {
      title: "Propiedad",
      management: "Gestión de propiedades",
      addNew: "Agregar nueva propiedad",
      edit: "Editar propiedad",
      delete: "Eliminar propiedad",
      save: "Guardar cambios",
      submitReview: "Enviar a revisión",
      fullAddress: "Dirección completa",
      propertyType: "Tipo de propiedad",
      renovationType: "Tipo de renovación",
      gallery: "Galería de imágenes",
      viewAll: "Ver todas",
      noImagesAvailable: "No hay imágenes disponibles",
      couldNotLoadImage: "No se pudo cargar la imagen",
      photo: "foto",
      photos: "fotos",
      saveSuccess: "Los datos se han guardado correctamente",
      trackingEnabled: "Seguimiento de obra activado",
      trackingDisabled: "Seguimiento de obra desactivado",
      trackingError: "Error al actualizar seguimiento",
      sections: {
        basicInfo: "Información de la propiedad",
        economicInfo: "Información económica",
        legalStatus: "Estado legal y de comunidad",
        documentation: "Documentación mínima",
        sellerData: "Datos del vendedor",
        sellerDataDescription: "Información de contacto directa del propietario de la vivienda o de la persona autorizada para representarle en la operación de venta.",
        tenantData: "Datos del inquilino",
        tenantDataDescription: "Información necesaria para evaluar la situación contractual y legal de la vivienda. Incluya la fecha de finalización del contrato vigente.",
        nextSection: "Siguiente sección",
      },
    },
    login: {
      title: "Inicia sesión o crea una cuenta",
      subtitle: "Accede a la plataforma de control de operaciones de PropHero",
      secureLoginButton: "Iniciar sesión de forma segura",
      createAccount: "Crear una cuenta",
      email: "Email",
      password: "Contraseña",
      emailPlaceholder: "tu@email.com",
      passwordPlaceholder: "••••••••",
      loginButton: "Iniciar sesión",
      loggingIn: "Iniciando sesión...",
      forgotPassword: "¿Olvidaste tu contraseña?",
      support: "Soporte",
      privacy: "Privacidad",
      terms: "Términos",
      copyright: "© 2025 PropHero - Todos los derechos reservados",
    },
    kanban: {
      draft: "Borrador",
      inReview: "En Revisión",
      needsCorrection: "Necesita Corrección",
      inNegotiation: "En Negociación",
      arras: "Arras",
      pendingToSettlement: "Pending to Settlement",
      settlement: "Escritura",
      sold: "Vendidas",
      rejected: "Rechazadas",
      // Supply Analyst phases
      backlog: "Backlog",
      underReview: "Under Review",
      renovationEstimation: "Renovation Estimation",
      financialAnalysis: "Financial Analysis",
      done: "Done",
      // Reno phases
      pending: "Pendiente",
      inProgress: "En Progreso",
      completed: "Completado",
      searchPlaceholder: "Buscar por ID, calle, precio,...",
      noPropertiesFound: "No tienes propiedades en este estado",
      addProperty: "Añadir propiedad",
      filterProperties: "Filtrar propiedades",
    },
    messages: {
      loading: "Cargando...",
      notFound: "Propiedad no encontrada",
      error: "Error",
      saveSuccess: "Datos guardados exitosamente",
      saveError: "Error al guardar los datos",
      submitSuccess: "Propiedad enviada para revisión exitosamente",
      submitError: "Error al enviar para revisión",
      deleteConfirm: "Eliminar Propiedad",
      deleteConfirmDescription: "¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.",
      completeRequiredFields: "Completa todos los campos requeridos antes de enviar",
      backToKanban: "Volver al Kanban",
    },
    sectionInfo: {
      requiredFields: "Campos requeridos para la revisión inicial",
      requiredFieldsDescription: "Todos los campos de esta sección son obligatorios para poder enviar la propiedad a revisión.",
      requiredDocuments: "Documentos requeridos para la revisión inicial",
      requiredDocumentsDescription: "Sube los documentos necesarios para que PropHero pueda revisar la propiedad.",
      optionalFields: "Información opcional",
      optionalFieldsDescription: "Esta información no es requerida para la revisión inicial, pero puede ser útil para el proceso de venta.",
    },
    propertyDetail: {
      title: "Página de detalle de propiedad",
      editProperty: "Editar propiedad",
      propertyId: "Property ID",
      cadastralReference: "Referencia catastral",
      tabs: {
        overview: "Overview",
        condition: "Condition",
        documents: "Documents",
        contacts: "Contacts",
        rental: "Rental",
        financial: "Financial",
      },
      status: {
        draft: "Borrador",
        underReview: "Under review",
        needsCorrection: "Necesita corrección",
        financialAnalysis: "Análisis financiero",
        renovationEstimation: "Estimación de reforma",
        inNegotiation: "En negociación",
        arras: "Arras",
        settlement: "Escritura",
        sold: "Vendidas",
        rejected: "Rechazadas",
        lastChange: "Último cambio",
        partner: "Partner",
        supplyAnalyst: "Supply Analyst",
        awaitingAssignment: "Awaiting assignment",
        propertyCreatedOn: "Property created on",
        lessThanAnHour: "Hace menos de una hora",
        day: "día",
        days: "días",
        hour: "hora",
        hours: "horas",
      },
      overview: {
        showAllPhotos: "Show all photos",
        propertyInformation: "Property information",
        basicFeatures: "Basic features",
        buildingFeatures: "Building features",
        economicInformation: "Economic information",
        legalAndCommunityStatus: "Legal and community status",
        documentation: "Documentation",
        location: "Location",
        viewAll: "View all",
        orientation: "Orientación",
      },
      contacts: {
        propertyOwners: "Propietarios",
        tenantInformation: "Información del inquilino",
        seller: "Vendedor",
        tenant: "Inquilino",
        idNumber: "Número de identificación",
        email: "Email",
        phoneNumber: "Número de teléfono",
        documents: "Documentos",
        noContacts: "No hay información de contacto disponible",
      },
      rental: {
        notRented: "Esta propiedad no está actualmente alquilada.",
        noTenantData: "No hay datos del inquilino disponibles.",
      },
      corrections: {
        title: "Correcciones",
        saveCorrections: "Guardar correcciones",
        viewCorrections: "Corrections view",
        addNew: "Agregar nueva",
        noCorrections: "No hay correcciones",
        category: "Categoría",
        subcategory: "Subcategoría",
        description: "Descripción",
        status: "Estado",
        createdBy: "Creada por",
        resolvedBy: "Resuelta por",
        approvedBy: "Aprobada por",
        createdAt: "Creada el",
        resolvedAt: "Resuelta el",
        approvedAt: "Aprobada el",
        pending: "Pendiente",
        resolved: "Resuelta",
        approved: "Aprobada",
        resolve: "Marcar como resuelta",
        approve: "Aprobar",
        delete: "Eliminar",
        addCorrection: "Agregar corrección",
        cancel: "Cancelar",
        selectCategory: "Selecciona una categoría",
        selectSubcategory: "Selecciona una subcategoría",
        descriptionPlaceholder: "Describe la corrección necesaria...",
        categories: {
          overview: "Overview",
          condition: "Condition",
          documents: "Documents",
          contacts: "Contacts",
          rental: "Rental",
        },
        subcategories: {
          overview: {
            propertyInformation: "Property information",
            economicInformation: "Economic information",
            legalAndCommunityStatus: "Legal and community status",
            documentation: "Documentation",
            location: "Location",
          },
          condition: {
            generalCondition: "General condition",
            specificSections: "Specific sections",
          },
          documents: {
            missingDocuments: "Missing documents",
            documentQualityIssues: "Document quality issues",
          },
          contacts: {
            sellerData: "Seller data",
            tenantData: "Tenant data",
          },
          rental: {
            contractTerms: "Contract terms",
            paymentInformation: "Payment information",
            insuranceInformation: "Insurance information",
          },
        },
        saving: "Guardando...",
        savedSuccessfully: "Correcciones guardadas exitosamente",
        errorSaving: "Error al guardar correcciones",
        errorCreating: "Error al crear corrección",
        errorUpdating: "Error al actualizar corrección",
        errorDeleting: "Error al eliminar corrección",
        confirmDelete: "Eliminar corrección",
        confirmDeleteDescription: "¿Estás seguro de que quieres eliminar esta corrección? Esta acción no se puede deshacer.",
      },
      approveProperty: "Approve Property",
      approving: "Aprobando...",
      makeFinancialEstimate: "Hacer Análisis Financiero",
    },
    
    // Financial Estimate
    financialEstimate: {
      noDetailsAvailable: "No hay detalles de estimación financiera disponibles",
      continueUpload: "Por favor continúa con la carga de la información para que podamos completar el proceso.",
      saving: "Guardando...",
      saveChanges: "Guardar cambios",
      pageTitle: "Añadir financiero",
      simulationTitle: "Simulación Financiera",
      simulationDescription: "Aquí puedes simular la financiación para evaluar si añadir el proyecto o no.",
      addFinancial: "Añadir financiero",
      noDataToDisplay: "No hay datos para mostrar",
      addBasicInformation: "Por favor añade la información básica para que podamos configurar la tabla",
      basicInformation: {
        title: "Información Básica",
        investmentAmount: "Importe de inversión",
        recurringCosts: "Costes Recurrentes",
        financing: "Financiación",
        scenarioDrivers: "Escenarios",
        purchasePrice: "Precio de Compra",
        closingCosts: "Costes de Cierre",
        monthlyRent: "Alquiler Mensual",
        propertyManagementPlan: "Plan de Gestión",
        ltv: "LTV",
        loanTerm: "Plazo del Préstamo",
        interestRate: "Tipo de Interés",
        years: "años",
        rentalVariationConservative: "Variación de Alquiler (Conservador)",
        rentalVariationFavorable: "Variación de Alquiler (Favorable)",
        occupancyRateConservative: "Tasa de Ocupación (Conservador)",
        occupancyRateFavorable: "Tasa de Ocupación (Favorable)",
        generateFinancial: "Generar análisis financiero",
        regenerateFinancial: "Regenerar análisis financiero",
      },
      profitabilityTable: {
        title: "Simulador de Rentabilidad de Propiedad",
        feasibilityConfirmed: "Viabilidad confirmada. La propiedad alcanza un umbral de rentabilidad del {threshold}% en al menos uno de los escenarios proyectados.",
        thresholdNotReached: "Umbral de rentabilidad no alcanzado. Ninguno de los escenarios proyectados cumple con el objetivo de negocio (>={threshold}%).",
        metric: "Métrica",
        conservativeScenario: "Escenario Conservador",
        favorableScenario: "Escenario Favorable",
        acquisitionCosts: "Costes de adquisición",
        salePrice: "Precio de Venta",
        purchasePrice: "Precio de Compra",
        deposit: "Depósito",
        taxes: "Impuestos",
        closingCosts: "Costes de Cierre",
        feesAndCapes: "Comisiones y CAPEX",
        renovationCost: "Coste de Renovación",
        furnishingCost: "Coste de Amueblamiento",
        tenantSearchingFee: "Comisión de Búsqueda de Inquilino",
        reAgentFee: "Comisión de Agente Inmobiliario",
        propHeroFee: "Comisión PropHero",
        investmentTotals: "Totales de inversión",
        totalInvestmentNonFinanced: "Inversión Total (Sin Financiación)",
        totalInvestmentFinanced: "Inversión Total (Con Financiación)",
        income: "Ingresos",
        grossMonthlyRent: "Alquiler Bruto Mensual",
        grossAnnualRent: "Alquiler Bruto Anual",
        grossYield: "Rentabilidad Bruta",
        operatingExpenses: "Gastos operativos",
        communityFeesMonthly: "Gastos de Comunidad (Mensual)",
        homeInsuranceMonthly: "Seguro del Hogar (Mensual)",
        ibiMonthly: "IBI (Mensual)",
        propertyManagementMonthly: "Gestión de Propiedad (Mensual)",
        loanInterest: "Intereses del Préstamo",
        returnsAndYields: "Rentabilidades y Rendimientos",
        netMonthlyRentNoFinancing: "Alquiler Neto Mensual (Sin Financiación)",
        netAnnualRentNoFinancing: "Alquiler Neto Anual (Sin Financiación)",
        netYieldNoFinancing: "Rentabilidad Neta (Sin Financiación)",
        netMonthlyRentFinancing: "Alquiler Neto Mensual (Con Financiación)",
        netAnnualRentFinancing: "Alquiler Neto Anual (Con Financiación)",
        netYieldFinancing: "Rentabilidad Neta (Con Financiación) - ROCE",
      },
    },
    
    // Form labels and placeholders
    formLabels: {
      onlyRequiredForPublishing: "Solo requerido para publicar la propiedad",
      indicateIfPropertyHas: "Indica si la propiedad tiene las siguientes características",
      confirmExactAmount: "Confirmo que este es el importe exacto.",
      confirmExactAmountIBI: "Confirmo que este es el importe exacto del IBI anual.",
      confirmExactAmountCommunity: "Confirmo que este es el importe exacto de los gastos de comunidad.",
      example: "Ej:",
      required: "Obligatorio",
      optional: "Opcional",
      streetNumber: "Número de la calle",
      floor: "Planta",
      block: "Bloque",
      door: "Puerta",
      staircase: "Escalera",
      selectOption: "Selecciona una opción",
      files: "archivo(s)",
      dragDropFiles: "Arrastra archivos aquí o haz clic para seleccionar",
      maxFileSize: "Máximo {size}MB por archivo",
      maxFilesInfo: "Máx. {maxFiles} archivos, {maxSizeMB}MB cada uno",
      photo: "Foto",
      video: "Video",
      cameraNotAvailable: "La cámara no está disponible en este dispositivo",
      cameraAccessError: "Error al acceder a la cámara",
    },
    propertyFields: {
      propertyType: "Tipo de propiedad",
      builtArea: "Superficie construida",
      usefulArea: "Superficie útil",
      constructionYear: "Año de construcción",
      cadastralReference: "Referencia Catastral",
      orientation: "Orientación del inmueble",
      orientationOptions: {
        norte: "Norte",
        sur: "Sur",
        este: "Este",
        oeste: "Oeste",
      },
      bedrooms: "Habitaciones",
      bathrooms: "Baños",
      parkingSpots: "Plazas de aparcamiento",
      elevator: "Ascensor",
      balconyTerrace: "Balcón/Terraza",
      storage: "Trastero",
      salePrice: "Precio de venta",
      monthlyCommunityFees: "Gastos de comunidad mensuales",
      annualIBI: "IBI Anual",
      confirmCommunityFees: "Confirmo que este es el importe exacto de los gastos de comunidad",
      confirmIBI: "Confirmo que este es el importe exacto del IBI anual",
      communityConstituted: "Comunidad de propietarios constituida",
      communityConstitutedDescription: "El edificio ya cuenta con una comunidad de vecinos formalmente establecida.",
      buildingInsuranceActive: "El edificio tiene seguro activo",
      buildingInsuranceActiveDescription: "El edificio cuenta actualmente con una póliza de seguro en vigor.",
      exclusiveMarketing: "PropHero se comercializa en exclusiva",
      exclusiveMarketingDescription: "Se cuenta con la autorización exclusiva para vender esta propiedad.",
      favorableITE: "El edificio tiene una ITE favorable en vigor",
      favorableITEDescription: "Indica si el edificio ha superado la inspección y cuenta con un informe favorable y vigente.",
      propertyRented: "La propiedad está actualmente alquilada",
      propertyRentedDescription: "La vivienda tiene un inquilino activo o un contrato de alquiler vigente.",
      tenantSituation: "Situación de los inquilinos tras la compra",
      tenantSituationOptions: {
        tenantsRemain: "Los inquilinos permanecen",
        propertyWillBeDeliveredFree: "El inmueble se entregará libre",
        illegallyOccupied: "Está ocupado ilegalmente",
      },
      generalVideo: "Video general de la propiedad",
      generalVideoDescription: "Sube un video mostrando la propiedad por dentro y por fuera. Puedes usar la cámara del móvil.",
      notaSimple: "Nota simple del registro",
      notaSimpleDescription: "Documento oficial que acredita la propiedad y su estado registral.",
      energyCertificate: "Certificado energético",
      energyCertificateDescription: "Documento que certifica la eficiencia energética de la propiedad.",
      squareMeters: "m²",
    },
    tenantFields: {
      fullName: "Nombre completo inquilino",
      email: "Email inquilino",
      phoneNumber: "Número de teléfono",
      dniNie: "DNI/NIE",
      dniNieDescription: "Documento de identidad del inquilino",
      rentalContract: "Contrato de arrendamiento",
      rentalContractDescription: "Documento del contrato de arrendamiento vigente",
      contractEndDate: "Fecha de finalización del contrato",
      noticePeriod: "Periodo de preaviso de finalización de contrato",
      days: "días",
      contractSubrogation: "Subrogación del contrato de arrendamiento",
      subrogationOptions: {
        withSubrogation: "Con subrogación",
        withoutSubrogation: "Sin subrogación",
      },
      rentalAmountToTransfer: "Importe del alquiler a transferir (al comprador)",
      perMonth: "€/mes",
      lastRentalUpdate: "Última actualización del alquiler",
      paymentProofs: "Justificantes de pago del inquilino",
      paymentProofsDescription: "Comprobantes de pago del alquiler",
      lastReceiptDate: "Fecha del último recibo",
      rentalTransferProof: "Comprobante de transferencia del alquiler (del vendedor)",
      rentalTransferProofDescription: "Comprobante de transferencia bancaria del alquiler",
      depositProof: "Justificante del depósito",
      depositProofDescription: "Documento que acredita el depósito de garantía",
      rentalInsuranceExpiryDate: "Fecha de vencimiento del seguro de alquiler",
      rentalInsuranceStatus: "Estado del seguro de alquiler",
      insuranceStatusOptions: {
        inForce: "En vigor",
        expired: "Caducado",
      },
      rentalInsuranceProvider: "Proveedor del seguro de alquiler",
      rentalInsuranceProviderPlaceholder: "Ej: Mapfre, Allianz,...",
      contractTermsAndConditions: "Términos y condiciones del contrato",
      paymentManagementAndSettlement: "Gestión de pagos y liquidación",
      rentalCoverageAndInsurance: "Cobertura e seguro de alquiler",
    },
    sellerFields: {
      numberOfOwners: "Cantidad de propietarios",
      owner: "Propietario",
      fullNameOrLegalName: "Nombre completo / Nombre legal",
      fullNameOrLegalNamePlaceholder: "Nombre de persona o entidad",
      identityDocumentNumber: "Número de documento de identidad",
      identityDocumentNumberPlaceholder: "Ej: 4566670D",
      identityDocumentNumberDescription: "DNI/NIF/CIF/NIE son documentos válidos.",
      dniNifCif: "DNI/NIF/CIF",
      dniNifCifDescription: "DNI/NIF/CIF/NIE son documentos válidos. Puedes subir múltiples archivos.",
      email: "Email",
      phoneNumber: "Número de teléfono",
      incrementQuantity: "Incrementar cantidad",
      decrementQuantity: "Decrementar cantidad",
    },
    sectionMessages: {
      tenantSectionUnavailable: "Esta sección solo está disponible cuando la propiedad está marcada como alquilada.",
      sectionInDevelopment: "Sección en desarrollo",
    },
    labels: {
      completed: "Completado",
    },
    sidebar: {
      basicData: "Datos Básicos de la Propiedad",
      ownerOccupation: "Datos del Propietario y Ocupación",
      statusCharacteristics: "Estado y Características de la Propiedad",
      propertyInformation: "Información de la Propiedad",
      platform: "Plataforma",
      settings: "Configuración",
      configuration: "Configuración",
      entrance: "Entrada y Distribución",
      distribution: "Distribución",
      rooms: "Habitaciones",
      livingRoom: "Salón",
      bathrooms: "Baños",
      kitchen: "Cocina",
      exterior: "Exteriores",
      soon: "Pronto",
      user: "Usuario",
      users: "Usuarios",
    },
    checklist: {
      title: "Checklist",
      buenEstado: "Buen estado",
      necesitaReparacion: "Necesita reparación",
      necesitaReemplazo: "Necesita reemplazo",
      noAplica: "No aplica",
      notes: "Observaciones",
      mandatory: "Obligatorio",
      submitChecklist: "Enviar checklist",
      submitChecklistDescription: "Finalizar y enviar el checklist completado",
      submitting: "Enviando checklist...",
      observations: "Observaciones",
      observationsDescription: "Escribe los detalles a tener en cuenta por el equipo de analistas y reformistas",
      photos: "Fotos",
      videos: "Videos",
      whatElementsBadCondition: "¿Qué elementos están en mal estado?",
      observationsPlaceholder: "Escribe los detalles a tener en cuenta por el equipo de analistas y reformistas",
      addPhotos: "Añade varias fotos y al menos un video de esta sección para que podamos verlo con detalle",
      dragDropFiles: "Arrastra y suelta archivos aquí",
      clickToBrowse: "O haz clic para explorar (máx. 10 archivos, 5MB cada uno)",
      elements: {
        accesoPrincipal: {
          puertaEntrada: "Puerta de entrada al edificio",
          cerradura: "Cerradura",
          bombin: "Bombín",
        },
        acabados: {
          paredes: "Paredes",
          techos: "Techos",
          suelo: "Suelo",
          rodapies: "Rodapiés",
        },
        comunicaciones: {
          telefonillo: "Telefonillo",
          timbre: "Timbre",
          buzon: "Buzón",
        },
        electricidad: {
          luces: "Luces",
          interruptores: "Interruptores",
          tomasCorriente: "Tomas de corriente",
          tomaTelevision: "Toma de Televisión",
        },
        carpinteria: {
          puertasInteriores: "Puertas interiores",
        },
      },
      sections: {
        entornoZonasComunes: {
          title: "Entorno y zonas comunes de la vivienda",
          description: "Evalúe el contexto de la propiedad: la comunidad, accesos exteriores y su estado general. Su valoración aquí ayuda a contextualizar la inversión.",
          portal: "Portal de la vivienda",
          fachada: "Fachada del edificio",
          entorno: "Entorno del edificio",
          accesoPrincipal: {
            title: "Acceso principal",
            description: "Evalúa la puerta de entrada al edificio, el estado de las cerraduras y el bombín",
            elements: {
              puertaEntrada: "Puerta de entrada al edificio",
              cerradura: "Cerradura",
              bombin: "Bombín",
            },
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          comunicaciones: {
            title: "Comunicaciones",
            description: "Revisa el telefonillo, el timbre y el buzón para ver si hay problemas o si no están funcionando bien.",
            elements: {
              telefonillo: "Telefonillo",
              timbre: "Timbre",
              buzon: "Buzón",
            },
          },
          electricidad: {
            title: "Electricidad",
            description: "Evalúa las luces, los interruptores y las tomas de corriente de la estancia.",
            elements: {
              luces: "Luces",
              interruptores: "Interruptores",
              tomasCorriente: "Tomas de corriente",
              tomaTelevision: "Toma de Televisión",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado de la carpintería del las puertas interiores de la comunidad.",
            elements: {
              puertasInteriores: "Puertas interiores",
            },
          },
        },
        estadoGeneral: {
          title: "Estado General de la Vivienda",
          description: "Score único para elementos repetidos en toda la casa. Marcar 'Mal estado' requiere justificación.",
          fotosPerspectivaGeneral: {
            title: "Fotos: perspectiva general de la vivienda",
            description: "Sube mínimo 1 foto que represente el estado dominante de paredes, suelos y carpintería en la vivienda (ej. pasillo, salón, una habitación).",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          climatizacion: {
            title: "Climatización",
            description: "Indica si hay radiadores o unidades de aire acondicionado y si están en buen estado.",
            items: {
              radiadores: "Radiadores",
              splitAc: "Split Unit de A/C",
              calentadorAgua: "Calentador de agua",
              calefaccionConductos: "Calefacción por conductos",
            },
          },
          electricidad: {
            title: "Electricidad",
            description: "Evalúa las luces, los interruptores y las tomas de corriente de la estancia.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              luces: "Luces",
              interruptores: "Interruptores",
              tomasCorriente: "Tomas de corriente",
              tomaTelevision: "Toma de Televisión",
            },
          },
        },
        entradaPasillos: {
          title: "Entrada y pasillos de la vivienda",
          description: "Detalle el acceso principal y la instalación eléctrica crítica. Incluye las fotos obligatorias del cuadro general de protección para validar la instalación.",
          cuadroGeneralElectrico: {
            title: "Cuadro general eléctrico",
            description: "Fotografía clara y frontal donde se vean todos los interruptores magnetotérmicos y diferenciales. Esta imagen es clave para estimar el coste de la reforma eléctrica.",
          },
          entradaViviendaPasillos: {
            title: "Entrada a la vivienda y pasillos",
            description: "Fotografía y video nítidos de la puerta de acceso a la vivienda, de la entrada desde el rellano y de los pasillos. Asegure que se vea claramente el estado del marco, la cerradura y el bombín.",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado y funcionamiento de ventanas, persianas, armarios empotrados y puerta de paso.",
            items: {
              ventanas: "Ventanas",
              persianas: "Persianas",
              armarios: "Armarios",
            },
          },
          electricidad: {
            title: "Electricidad",
            description: "Evalúa luces, interruptores y tomas de corriente. Comprueba si funcionan correctamente.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              luces: "Luces",
              interruptores: "Interruptores",
              tomasCorriente: "Tomas de corriente",
              tomaTelevision: "Toma de Televisión",
            },
          },
          climatizacion: {
            title: "Climatización",
            description: "Indica si hay radiadores o unidades de aire acondicionado y si están en buen estado.",
            items: {
              radiadores: "Radiadores",
              splitAc: "Split Unit de A/C",
            },
          },
          mobiliario: {
            title: "Mobiliario",
            existeMobiliario: "Existe mobiliario",
            queMobiliarioExiste: "¿Qué mobiliario existe?",
          },
        },
        habitaciones: {
          title: "Habitaciones",
          bedroom: "Habitación",
          habitaciones: "Habitaciones",
          description: "Documentación visual de las habitaciones. Recuerde: La evaluación de suelos, paredes y carpintería ya fue completada en el estado general. Utilice las notas para destacar anomalías específicas.",
          numeroHabitaciones: "Número de habitaciones de la vivienda",
          fotosVideoHabitacion: {
            title: "Fotos y video de la habitación",
            description: "El video debe mostrar una panorámica completa de la habitación. Priorice la iluminación y asegúrese de incluir todas las paredes, la ventana y el armario empotrado (si existe).",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado y funcionamiento de ventanas, persianas, armarios empotrados y puerta de paso.",
            items: {
              ventanas: "Ventanas",
              persianas: "Persianas",
              armarios: "Armarios",
            },
            puertaEntrada: "Puerta de entrada",
          },
          electricidad: {
            title: "Electricidad",
            description: "Evalúa luces, interruptores y tomas de corriente. Comprueba si funcionan correctamente.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              luces: "Luces",
              interruptores: "Interruptores",
              tomasCorriente: "Tomas de corriente",
              tomaTelevision: "Toma de Televisión",
            },
          },
          climatizacion: {
            title: "Climatización",
            description: "Indica si hay radiadores o unidades de aire acondicionado y si están en buen estado.",
            items: {
              radiadores: "Radiadores",
              splitAc: "Split Unit de A/C",
            },
          },
          mobiliario: {
            title: "Mobiliario",
            existeMobiliario: "Existe mobiliario",
            queMobiliarioExiste: "¿Qué mobiliario existe?",
          },
        },
        salon: {
          title: "Salón",
          description: "Documentación visual del Salón. El vídeo debe ofrecer una visión completa de la distribución del espacio principal.",
          fotosVideoSalon: {
            title: "Fotos y vídeo del salón",
            description: "Video que muestre el flujo y la distribución del Salón. La fotografía debe capturar la mayor amplitud posible del espacio.",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado y funcionamiento de ventanas, persianas, armarios empotrados y puerta de paso.",
            items: {
              ventanas: "Ventanas",
              persianas: "Persianas",
              armarios: "Armarios",
            },
            puertaEntrada: "Puerta de entrada",
          },
          electricidad: {
            title: "Electricidad",
            description: "Evalúa luces, interruptores y tomas de corriente. Comprueba si funcionan correctamente.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              luces: "Luces",
              interruptores: "Interruptores",
              tomasCorriente: "Tomas de corriente",
              tomaTelevision: "Toma de Televisión",
            },
          },
          climatizacion: {
            title: "Climatización",
            description: "Indica si hay radiadores o unidades de aire acondicionado y si están en buen estado.",
            items: {
              radiadores: "Radiadores",
              splitAc: "Split Unit de A/C",
            },
          },
          mobiliario: {
            existeMobiliario: "Existe mobiliario",
            queMobiliarioExiste: "¿Qué mobiliario existe?",
          },
        },
        banos: {
          title: "Baños",
          bathroom: "Baño",
          description: "Inspección detallada de las zonas húmedas. Esta evaluación se centra en el estado de la fontanería, el drenaje y los sanitarios. La valoración de cada baño es independiente.",
          fotosVideoBano: {
            title: "Fotos y vídeo del baño",
            description: "Video centrado en el estado de los sanitarios, grifería y ducha/bañera. Incluye una foto de los azulejos y las juntas si se ha detectado moho, humedad o algún desperfecto.",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          aguaDrenaje: {
            title: "Agua y drenaje",
            description: "Revisa los puntos de agua fría y caliente, así como los sistemas de desagües.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              puntosAgua: "Puntos de agua fría y caliente",
              desagues: "Desagües",
            },
          },
          sanitarios: {
            title: "Sanitarios",
            description: "Revisa que el inodoro, lavabo y ducha o bañera estén en buen estado, sin fugas ni desperfectos.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              platoDuchaBanera: "Plato de ducha / Bañera",
              inodoro: "Inodoro (Víter)",
              lavabo: "Lavabo (Roca)",
            },
          },
          griferiaDucha: {
            title: "Grifería y ducha o bañera",
            description: "Verifica el estado de los grifos y mampara o cortina de ducha.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              grifos: "Grifos",
              mamparaCortina: "Mampara de ducha / Cortina",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado y funcionamiento de ventanas, persianas, armarios empotrados y puerta de paso.",
            items: {
              ventanas: "Ventanas",
              persianas: "Persianas",
            },
            puertaEntrada: "Puerta de entrada",
          },
          mobiliario: {
            title: "Mobiliario",
            description: "Revisa el estado del mueble de lavabo, espejo y accesorios como el toallero o portapapeles.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              muebleLavabo: "Mueble de lavabo",
              espejo: "Espejo",
              toalleroPortapapeles: "Toallero / Portapapeles",
            },
          },
          ventilacion: {
            title: "Ventilación",
            description: "Indica si el baño cuenta con ventana o sistema de ventilación forzada (extracción) y evalúa su estado.",
          },
        },
        cocina: {
          title: "Cocina",
          description: "Inspección detallada del mobiliario fijo, agua y electrodomésticos. Por favor, asegure la máxima precisión en el estado de los módulos y la encimera.",
          fotosVideoCocina: {
            title: "Fotos y vídeo de la cocina",
            description: "Video que muestre el mobiliario fijo (módulos, encimera) y los electrodomésticos en su contexto. La foto debe capturar el estado general de la encimera y los frontales.",
          },
          acabados: {
            title: "Acabados",
            description: "Evalúa el estado de las paredes, los techos, el suelo y los rodapiés. Busca marcas, desgaste y humedades.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          mobiliarioFijo: {
            title: "Mobiliario Fijo",
            description: "Revisa el estado de los módulos bajos y altos, la encimera y el zócalo. Comprueba que estén bien sujetos y sin daños visibles.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              modulosBajos: "Módulos bajos",
              modulosAltos: "Módulos altos",
              encimera: "Encimera",
              zocalo: "Zócalo",
            },
          },
          aguaDrenaje: {
            title: "Agua y drenaje",
            description: "Verifica el estado del fregadero y el grifo. Asegúrate de que no haya fugas y que el desagüe funcione correctamente.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              grifo: "Grifo",
              fregadero: "Fregadero",
              desagues: "Desagües",
            },
          },
          carpinteria: {
            title: "Carpintería",
            description: "Revisa el estado y funcionamiento de ventanas, persianas, armarios empotrados y puerta de paso.",
            items: {
              ventanas: "Ventanas y vierteaguas",
              persianas: "Persianas",
            },
            puertaEntrada: "Puerta de entrada",
          },
          almacenamiento: {
            title: "Almacenamiento",
            items: {
              armariosDespensa: "Armarios Despensa",
              cuartoLavado: "Cuarto de lavado",
            },
          },
          electrodomesticos: {
            title: "Electrodomésticos",
            items: {
              placaGas: "Placa de cocina - gas",
              placaVitroInduccion: "Placa de cocina - Vitro o Inducción",
              campanaExtractora: "Campana extractora",
              horno: "Horno",
              nevera: "Nevera",
              lavadora: "Lavadora",
              lavavajillas: "Lavavajillas",
              microondas: "Microondas",
            },
          },
        },
        exteriores: {
          title: "Exteriores de la Vivienda",
          description: "Evalúe los elementos de la propiedad con acceso al exterior (balcones, terrazas, tendederos). Priorice la seguridad (barandillas y rejas) y los acabados exteriores.",
          fotosVideoExterior: {
            title: "Fotos y vídeo del exterior (terraza, balcón o patio)",
            description: "Documente las vistas, el estado del pavimento y la seguridad (barandillas, rejas). Indique si el acceso está habilitado y si aplica para la propiedad.",
          },
          seguridad: {
            title: "Seguridad",
            items: {
              barandillas: "Barandillas",
              rejas: "Rejas",
            },
          },
          sistemas: {
            title: "Sistemas",
            items: {
              tendederoExterior: "Tendedero exterior",
              toldos: "Toldos",
            },
          },
          acabadosExteriores: {
            title: "Acabados exteriores",
            description: "Evalúa el estado de paredes, techos, suelo y rodapiés. Revisa si hay desgaste, daños o signos de humedad.",
            whatElementsBadCondition: "¿Qué elementos están en mal estado?",
            elements: {
              paredes: "Paredes",
              techos: "Techos",
              suelo: "Suelo",
              rodapies: "Rodapiés",
            },
          },
          observaciones: {
            title: "Observaciones",
            description: "Escribe los detalles a tener en cuenta por el equipo de analistas y reformistas",
            placeholder: "Escribe los detalles a tener en cuenta por el equipo de analistas y reformistas",
          },
        },
      },
    },
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      continue: "Continue",
      back: "Back",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      yes: "Yes",
      no: "No",
    },
    nav: {
      home: "Home",
      kanban: "Property Management",
      properties: "Properties",
      proyecto: "Project",
      notifications: "Notifications",
      help: "Help",
      logout: "Logout",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      auto: "Auto",
      system: "System",
    },
    language: {
      spanish: "Spanish",
      english: "English",
    },
    userMenu: {
      theme: "Theme",
      language: "Language",
      settings: "Settings",
      changePassword: {
        title: "Change Password",
        description: "Enter your current password and new password to update your account.",
        menuItem: "Change Password",
        currentPassword: "Current Password",
        currentPasswordPlaceholder: "Enter your current password",
        newPassword: "New Password",
        newPasswordPlaceholder: "Enter your new password",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your new password",
        updateButton: "Update Password",
        updating: "Updating...",
        success: "Password updated successfully",
        errors: {
          allFieldsRequired: "All fields are required",
          passwordTooShort: "Password must be at least 6 characters",
          passwordsDoNotMatch: "Passwords do not match",
          samePassword: "New password must be different from current password",
          currentPasswordIncorrect: "Current password is incorrect",
          userNotFound: "User not found",
          generic: "Error changing password. Please try again.",
        },
      },
    },
    roles: {
      supply_partner: "Supply Partner",
      supply_analyst: "Supply Analyst",
      supply_admin: "Supply Admin",
      supply_lead: "Supply Lead",
      reno_lead: "Reno Lead",
      renovator_analyst: "Reno Analyst",
      scouter: "Scouter",
      supply_project_analyst: "Project Analyst",
      supply_project_lead: "Project Lead",
    },
    property: {
      title: "Property",
      management: "Property Management",
      addNew: "Add New Property",
      edit: "Edit Property",
      delete: "Delete Property",
      save: "Save Changes",
      submitReview: "Submit for Review",
      fullAddress: "Full Address",
      propertyType: "Property Type",
      renovationType: "Renovation Type",
      gallery: "Image Gallery",
      viewAll: "View All",
      noImagesAvailable: "No images available",
      couldNotLoadImage: "Could not load image",
      photo: "photo",
      photos: "photos",
      saveSuccess: "Data saved successfully",
      trackingEnabled: "Work follow-up enabled",
      trackingDisabled: "Work follow-up disabled",
      trackingError: "Error updating follow-up",
      sections: {
        basicInfo: "Property Information",
        economicInfo: "Economic Information",
        legalStatus: "Legal and Community Status",
        documentation: "Documentation",
        sellerData: "Seller Data",
        sellerDataDescription: "Direct contact information of the property owner or the person authorized to represent them in the sale transaction.",
        tenantData: "Tenant Data",
        tenantDataDescription: "Information necessary to evaluate the contractual and legal situation of the property. Include the expiration date of the current contract.",
        nextSection: "Next Section",
      },
    },
    login: {
      title: "Log in or create an account",
      subtitle: "Access the PropHero operations control platform",
      secureLoginButton: "Log in securely",
      createAccount: "Create an account",
      email: "Email",
      password: "Password",
      emailPlaceholder: "your@email.com",
      passwordPlaceholder: "••••••••",
      loginButton: "Log in",
      loggingIn: "Logging in...",
      forgotPassword: "Forgot your password?",
      support: "Support",
      privacy: "Privacy",
      terms: "Terms",
      copyright: "© 2025 PropHero - All rights reserved",
    },
    kanban: {
      draft: "Draft",
      inReview: "In Review",
      needsCorrection: "Needs Correction",
      inNegotiation: "In Negotiation",
      arras: "Arras",
      pendingToSettlement: "Pending to Settlement",
      settlement: "Settlement",
      sold: "Sold",
      rejected: "Rejected",
      // Supply Analyst phases
      backlog: "Backlog",
      underReview: "Under Review",
      renovationEstimation: "Renovation Estimation",
      financialAnalysis: "Financial Analysis",
      done: "Done",
      // Reno phases
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      searchPlaceholder: "Search by ID, street, price,...",
      noPropertiesFound: "You have no properties in this state",
      addProperty: "Add property",
      filterProperties: "Filter properties",
    },
    messages: {
      loading: "Loading...",
      notFound: "Property not found",
      error: "Error",
      saveSuccess: "Data saved successfully",
      saveError: "Error saving data",
      submitSuccess: "Property submitted for review successfully",
      submitError: "Error submitting for review",
      deleteConfirm: "Delete Property",
      deleteConfirmDescription: "Are you sure you want to delete this property? This action cannot be undone.",
      completeRequiredFields: "Complete all required fields before submitting",
      backToKanban: "Back to Kanban",
    },
    sectionInfo: {
      requiredFields: "Required fields for initial review",
      requiredFieldsDescription: "All fields in this section are mandatory to submit the property for review.",
      requiredDocuments: "Required documents for initial review",
      requiredDocumentsDescription: "Upload the necessary documents so PropHero can review the property.",
      optionalFields: "Optional information",
      optionalFieldsDescription: "This information is not required for initial review, but may be useful for the sales process.",
    },
    propertyDetail: {
      title: "Property detail page",
      editProperty: "Edit property",
      propertyId: "Property ID",
      cadastralReference: "Cadastral reference",
      tabs: {
        overview: "Overview",
        condition: "Condition",
        documents: "Documents",
        contacts: "Contacts",
        rental: "Rental",
        financial: "Financial",
      },
      status: {
        draft: "Draft",
        underReview: "Under review",
        needsCorrection: "Needs correction",
        financialAnalysis: "Financial Analysis",
        renovationEstimation: "Renovation Estimation",
        inNegotiation: "In negotiation",
        arras: "Arras",
        settlement: "Settlement",
        sold: "Sold",
        rejected: "Rejected",
        lastChange: "Last change",
        partner: "Partner",
        supplyAnalyst: "Supply Analyst",
        awaitingAssignment: "Awaiting assignment",
        propertyCreatedOn: "Property created on",
        lessThanAnHour: "Less than an hour ago",
        day: "day",
        days: "days",
        hour: "hour",
        hours: "hours",
      },
      overview: {
        showAllPhotos: "Show all photos",
        propertyInformation: "Property information",
        basicFeatures: "Basic features",
        buildingFeatures: "Building features",
        economicInformation: "Economic information",
        legalAndCommunityStatus: "Legal and community status",
        documentation: "Documentation",
        location: "Location",
        viewAll: "View all",
        orientation: "Orientation",
      },
      contacts: {
        propertyOwners: "Property owners",
        tenantInformation: "Tenant information",
        seller: "Seller",
        tenant: "Tenant",
        idNumber: "ID Number",
        email: "Email",
        phoneNumber: "Phone number",
        documents: "Documents",
        noContacts: "No contact information available",
      },
      rental: {
        notRented: "This property is not currently rented.",
        noTenantData: "No tenant data available.",
      },
      corrections: {
        title: "Corrections",
        saveCorrections: "Save corrections",
        viewCorrections: "Corrections view",
        addNew: "Add new",
        noCorrections: "No corrections",
        category: "Category",
        subcategory: "Subcategory",
        description: "Description",
        status: "Status",
        createdBy: "Created by",
        resolvedBy: "Resolved by",
        approvedBy: "Approved by",
        createdAt: "Created at",
        resolvedAt: "Resolved at",
        approvedAt: "Approved at",
        pending: "Pending",
        resolved: "Resolved",
        approved: "Approved",
        resolve: "Mark as resolved",
        approve: "Approve",
        delete: "Delete",
        addCorrection: "Add correction",
        cancel: "Cancel",
        selectCategory: "Select a category",
        selectSubcategory: "Select a subcategory",
        descriptionPlaceholder: "Describe the correction needed...",
        categories: {
          overview: "Overview",
          condition: "Condition",
          documents: "Documents",
          contacts: "Contacts",
          rental: "Rental",
        },
        subcategories: {
          overview: {
            propertyInformation: "Property information",
            economicInformation: "Economic information",
            legalAndCommunityStatus: "Legal and community status",
            documentation: "Documentation",
            location: "Location",
          },
          condition: {
            generalCondition: "General condition",
            specificSections: "Specific sections",
          },
          documents: {
            missingDocuments: "Missing documents",
            documentQualityIssues: "Document quality issues",
          },
          contacts: {
            sellerData: "Seller data",
            tenantData: "Tenant data",
          },
          rental: {
            contractTerms: "Contract terms",
            paymentInformation: "Payment information",
            insuranceInformation: "Insurance information",
          },
        },
        saving: "Saving...",
        savedSuccessfully: "Corrections saved successfully",
        errorSaving: "Error saving corrections",
        errorCreating: "Error creating correction",
        errorUpdating: "Error updating correction",
        errorDeleting: "Error deleting correction",
        confirmDelete: "Delete correction",
        confirmDeleteDescription: "Are you sure you want to delete this correction? This action cannot be undone.",
      },
      approveProperty: "Approve Property",
      approving: "Approving...",
      makeFinancialEstimate: "Make Financial Estimate",
    },
    
    // Financial Estimate
    financialEstimate: {
      noDetailsAvailable: "No financial estimate details available",
      continueUpload: "Please continue with the upload of the information so that we can complete the process.",
      saving: "Saving...",
      saveChanges: "Save Changes",
      pageTitle: "Add financial",
      simulationTitle: "Financial Simulation",
      simulationDescription: "Here you can simulate the financing to assess whether to add the project or not.",
      addFinancial: "Add financial",
      noDataToDisplay: "No data to display",
      addBasicInformation: "Please add the basic information so we can set up the table",
      basicInformation: {
        title: "Basic Information",
        investmentAmount: "Investment amount",
        recurringCosts: "Recurring Costs",
        financing: "Financing",
        scenarioDrivers: "Scenario Drivers",
        purchasePrice: "Purchase Price",
        closingCosts: "Closing Costs",
        monthlyRent: "Monthly Rent",
        propertyManagementPlan: "Property Management Plan",
        ltv: "LTV",
        loanTerm: "Loan Term",
        interestRate: "Interest Rate",
        years: "years",
        rentalVariationConservative: "Rental Variation (Conservative)",
        rentalVariationFavorable: "Rental Variation (Favorable)",
        occupancyRateConservative: "Occupancy Rate (Conservative)",
        occupancyRateFavorable: "Occupancy Rate (Favorable)",
        generateFinancial: "Generate financial",
        regenerateFinancial: "Regenerate financial",
      },
      profitabilityTable: {
        title: "Property Profitability Simulator",
        feasibilityConfirmed: "Feasibility confirmed. The property reaches a profitability threshold of {threshold}% in at least one of the projected scenarios.",
        thresholdNotReached: "Profitability threshold not reached. None of the projected scenarios meet the business objective (>={threshold}%).",
        metric: "Metric",
        conservativeScenario: "Conservative Scenario",
        favorableScenario: "Favorable Scenario",
        acquisitionCosts: "Acquisition costs",
        salePrice: "Sale Price",
        purchasePrice: "Purchase Price",
        deposit: "Deposit",
        taxes: "Taxes",
        closingCosts: "Closing Costs",
        feesAndCapes: "Fees & Capes",
        renovationCost: "Renovation Cost",
        furnishingCost: "Furnishing Cost",
        tenantSearchingFee: "Tenant Searching Fee",
        reAgentFee: "RE Agent Fee",
        propHeroFee: "PropHero Fee",
        investmentTotals: "Investment totals",
        totalInvestmentNonFinanced: "Total Investment (Non Financed)",
        totalInvestmentFinanced: "Total Investment (Financed)",
        income: "Income",
        grossMonthlyRent: "Gross Monthly Rent",
        grossAnnualRent: "Gross Annual Rent",
        grossYield: "Gross Yield",
        operatingExpenses: "Operating expenses",
        communityFeesMonthly: "Community Fees (Monthly)",
        homeInsuranceMonthly: "Home Insurance (Monthly)",
        ibiMonthly: "IBI (Monthly)",
        propertyManagementMonthly: "Property Management (Monthly)",
        loanInterest: "Loan Interest",
        returnsAndYields: "Returns & Yields",
        netMonthlyRentNoFinancing: "Net Monthly Rent (No Financing)",
        netAnnualRentNoFinancing: "Net Annual Rent (No Financing)",
        netYieldNoFinancing: "Net Yield (No Financing)",
        netMonthlyRentFinancing: "Net Monthly Rent (Financing)",
        netAnnualRentFinancing: "Net Annual Rent (Financing)",
        netYieldFinancing: "Net Yield (Financing) - ROCE",
      },
    },
    
    // Form labels and placeholders
    formLabels: {
      onlyRequiredForPublishing: "Only required to publish the property",
      indicateIfPropertyHas: "Indicate if the property has the following characteristics",
      confirmExactAmount: "I confirm that this is the exact amount.",
      confirmExactAmountIBI: "I confirm that this is the exact amount of the annual IBI.",
      confirmExactAmountCommunity: "I confirm that this is the exact amount of the community fees.",
      example: "E.g.:",
      required: "Required",
      optional: "Optional",
      streetNumber: "Street number",
      floor: "Floor",
      block: "Block",
      door: "Door",
      staircase: "Staircase",
      selectOption: "Select an option",
      files: "file(s)",
      dragDropFiles: "Drag files here or click to select",
      maxFileSize: "Maximum {size}MB per file",
      maxFilesInfo: "Max. {maxFiles} files, {maxSizeMB}MB each",
      photo: "Photo",
      video: "Video",
      cameraNotAvailable: "Camera is not available on this device",
      cameraAccessError: "Error accessing camera",
    },
    propertyFields: {
      propertyType: "Property type",
      builtArea: "Built area",
      usefulArea: "Useful area",
      constructionYear: "Construction year",
      cadastralReference: "Cadastral reference",
      orientation: "Property orientation",
      orientationOptions: {
        norte: "North",
        sur: "South",
        este: "East",
        oeste: "West",
      },
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      parkingSpots: "Parking spots",
      elevator: "Elevator",
      balconyTerrace: "Balcony/Terrace",
      storage: "Storage",
      salePrice: "Sale price",
      monthlyCommunityFees: "Monthly community fees",
      annualIBI: "Annual IBI",
      confirmCommunityFees: "I confirm that this is the exact amount of the community fees",
      confirmIBI: "I confirm that this is the exact amount of the annual IBI",
      communityConstituted: "Owners' community constituted",
      communityConstitutedDescription: "The building already has a formally established neighbors' community.",
      buildingInsuranceActive: "The building has active insurance",
      buildingInsuranceActiveDescription: "The building currently has an active insurance policy in force.",
      exclusiveMarketing: "PropHero markets exclusively",
      exclusiveMarketingDescription: "We have exclusive authorization to sell this property.",
      favorableITE: "The building has a favorable ITE in force",
      favorableITEDescription: "Indicate if the building has passed the inspection and has a favorable and valid report.",
      propertyRented: "The property is currently rented",
      propertyRentedDescription: "The property has an active tenant or a valid rental contract.",
      tenantSituation: "Tenant situation after purchase",
      tenantSituationOptions: {
        tenantsRemain: "Tenants remain",
        propertyWillBeDeliveredFree: "The property will be delivered free",
        illegallyOccupied: "It is illegally occupied",
      },
      generalVideo: "General property video",
      generalVideoDescription: "Upload a video showing the property inside and out. You can use your mobile camera.",
      notaSimple: "Nota simple from registry",
      notaSimpleDescription: "Official document certifying the property and its registration status.",
      energyCertificate: "Energy certificate",
      energyCertificateDescription: "Document certifying the energy efficiency of the property.",
      squareMeters: "m²",
    },
    tenantFields: {
      fullName: "Tenant full name",
      email: "Tenant email",
      phoneNumber: "Phone number",
      dniNie: "DNI/NIE",
      dniNieDescription: "Tenant identity document",
      rentalContract: "Rental contract",
      rentalContractDescription: "Current rental contract document",
      contractEndDate: "Contract end date",
      noticePeriod: "Contract termination notice period",
      days: "days",
      contractSubrogation: "Rental contract subrogation",
      subrogationOptions: {
        withSubrogation: "With subrogation",
        withoutSubrogation: "Without subrogation",
      },
      rentalAmountToTransfer: "Rental amount to transfer (to buyer)",
      perMonth: "€/month",
      lastRentalUpdate: "Last rental update",
      paymentProofs: "Tenant payment proofs",
      paymentProofsDescription: "Rental payment receipts",
      lastReceiptDate: "Last receipt date",
      rentalTransferProof: "Rental transfer proof (from seller)",
      rentalTransferProofDescription: "Bank transfer proof of rental",
      depositProof: "Deposit proof",
      depositProofDescription: "Document certifying the security deposit",
      rentalInsuranceExpiryDate: "Rental insurance expiry date",
      rentalInsuranceStatus: "Rental insurance status",
      insuranceStatusOptions: {
        inForce: "In force",
        expired: "Expired",
      },
      rentalInsuranceProvider: "Rental insurance provider",
      rentalInsuranceProviderPlaceholder: "E.g.: Mapfre, Allianz,...",
      contractTermsAndConditions: "Contract terms and conditions",
      paymentManagementAndSettlement: "Payment management and settlement",
      rentalCoverageAndInsurance: "Rental coverage and insurance",
    },
    sellerFields: {
      numberOfOwners: "Number of owners",
      owner: "Owner",
      fullNameOrLegalName: "Full name / Legal name",
      fullNameOrLegalNamePlaceholder: "Person or entity name",
      identityDocumentNumber: "Identity document number",
      identityDocumentNumberPlaceholder: "E.g.: 4566670D",
      identityDocumentNumberDescription: "DNI/NIF/CIF/NIE are valid documents.",
      dniNifCif: "DNI/NIF/CIF",
      dniNifCifDescription: "DNI/NIF/CIF/NIE are valid documents. You can upload multiple files.",
      email: "Email",
      phoneNumber: "Phone number",
      incrementQuantity: "Increment quantity",
      decrementQuantity: "Decrement quantity",
    },
    sectionMessages: {
      tenantSectionUnavailable: "This section is only available when the property is marked as rented.",
      sectionInDevelopment: "Section in development",
    },
    labels: {
      completed: "Completed",
    },
    sidebar: {
      basicData: "Basic Property Data",
      ownerOccupation: "Owner and Occupation Data",
      statusCharacteristics: "Property Status and Characteristics",
      propertyInformation: "Property Information",
      platform: "Platform",
      settings: "Settings",
      configuration: "Configuration",
      entrance: "Entrance and Distribution",
      distribution: "Distribution",
      rooms: "Rooms",
      livingRoom: "Living Room",
      bathrooms: "Bathrooms",
      kitchen: "Kitchen",
      exterior: "Exterior",
      soon: "Soon",
      user: "User",
      users: "Users",
    },
    checklist: {
      title: "Checklist",
      buenEstado: "Good condition",
      necesitaReparacion: "Needs repair",
      necesitaReemplazo: "Needs replacement",
      noAplica: "Not applicable",
      notes: "Observations",
      mandatory: "Mandatory",
      submitChecklist: "Submit checklist",
      submitChecklistDescription: "Finalize and submit the completed checklist",
      submitting: "Submitting checklist...",
      observations: "Observations",
      observationsDescription: "Write down the details to be considered by the team of analysts and reformers",
      photos: "Photos",
      videos: "Videos",
      whatElementsBadCondition: "What elements are in bad condition?",
      observationsPlaceholder: "Write down the details to be considered by the team of analysts and reformers",
      addPhotos: "Please add several photos and at least one video of this section so we can see it in detail",
      dragDropFiles: "Drag and drop files here",
      clickToBrowse: "Or click to browse (max. 10 files, 5MB each)",
      elements: {
        accesoPrincipal: {
          puertaEntrada: "Building entrance door",
          cerradura: "Lock",
          bombin: "Cylinder",
        },
        acabados: {
          paredes: "Walls",
          techos: "Ceilings",
          suelo: "Floor",
          rodapies: "Baseboards",
        },
        comunicaciones: {
          telefonillo: "Intercom",
          timbre: "Doorbell",
          buzon: "Mailbox",
        },
        electricidad: {
          luces: "Lights",
          interruptores: "Switches",
          tomasCorriente: "Power outlets",
          tomaTelevision: "TV outlet",
        },
        carpinteria: {
          puertasInteriores: "Interior doors",
        },
      },
      sections: {
        entornoZonasComunes: {
          title: "Surroundings and Common Areas",
          description: "Evaluate the property's context: the community, exterior accesses, and its general state. Your valuation here helps contextualize the investment.",
          portal: "Property entrance/portal",
          fachada: "Building facade",
          entorno: "Building surroundings",
          accesoPrincipal: {
            title: "Main access",
            description: "Evaluate the building entrance door, the condition of the locks and the cylinder",
            elements: {
              puertaEntrada: "Building entrance door",
              cerradura: "Lock",
              bombin: "Cylinder",
            },
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of walls, ceilings, floor and baseboards. Look for marks, wear and moisture.",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          comunicaciones: {
            title: "Communications",
            description: "Check the intercom, doorbell and mailbox to see if there are problems or if they are not working well.",
            elements: {
              telefonillo: "Intercom",
              timbre: "Doorbell",
              buzon: "Mailbox",
            },
          },
          electricidad: {
            title: "Electricity",
            description: "Evaluate the lights, switches and power outlets of the room.",
            elements: {
              luces: "Lights",
              interruptores: "Switches",
              tomasCorriente: "Power outlets",
              tomaTelevision: "TV outlet",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Check the condition of the interior door carpentry of the community.",
            elements: {
              puertasInteriores: "Interior doors",
            },
          },
        },
        estadoGeneral: {
          title: "General State of the Property",
          description: "Unique score for elements repeated throughout the house. Marking 'Bad condition' requires justification.",
          fotosPerspectivaGeneral: {
            title: "Photos: general perspective of the property",
            description: "Upload at least 1 photo that represents the dominant state of walls, floors, and carpentry in the property (e.g., hallway, living room, a room).",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of the walls, ceilings, floor, and baseboards. Look for marks, wear, and dampness.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          climatizacion: {
            title: "Climate Control",
            description: "Indicate if there are radiators or air conditioning units and if they are in good condition.",
            items: {
              radiadores: "Radiators",
              splitAc: "Split A/C Unit",
              calentadorAgua: "Water heater",
              calefaccionConductos: "Ducted heating",
            },
          },
          electricidad: {
            title: "Electricity",
            description: "Evaluate the lights, switches, and power outlets in the room.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              luces: "Lights",
              interruptores: "Switches",
              tomasCorriente: "Power outlets",
              tomaTelevision: "TV outlet",
            },
          },
        },
        entradaPasillos: {
          title: "Entrance and hallways of the dwelling",
          description: "Detail the main access and critical electrical installation. Includes mandatory photos of the general protection panel to validate the installation.",
          cuadroGeneralElectrico: {
            title: "General electrical panel",
            description: "Clear and frontal photograph showing all magnetothermal and differential switches. This image is key to estimating the cost of the electrical renovation.",
          },
          entradaViviendaPasillos: {
            title: "Entrance to the dwelling and hallways",
            description: "Clear photographs and videos of the access door to the dwelling, of the entrance from the landing and of the hallways. Ensure that the condition of the frame, the lock and the cylinder are clearly visible.",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of the walls, ceilings, floor and baseboards. Look for marks, wear and humidity.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Review the condition and operation of windows, blinds, built-in wardrobes and passage doors.",
            items: {
              ventanas: "Windows",
              persianas: "Blinds",
              armarios: "Wardrobes",
            },
          },
          electricidad: {
            title: "Electricity",
            description: "Evaluate lights, switches and power outlets. Check if they work correctly.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              luces: "Lights",
              interruptores: "Switches",
              tomasCorriente: "Power outlets",
              tomaTelevision: "TV outlet",
            },
          },
          climatizacion: {
            title: "Climate Control",
            description: "Indicate if there are radiators or air conditioning units and if they are in good condition.",
            items: {
              radiadores: "Radiators",
              splitAc: "Split A/C Unit",
            },
          },
          mobiliario: {
            title: "Furniture",
            existeMobiliario: "Furniture exists",
            queMobiliarioExiste: "What furniture exists?",
          },
        },
        habitaciones: {
          title: "Bedrooms",
          bedroom: "Bedroom",
          habitaciones: "Bedrooms",
          description: "Visual documentation of the bedrooms. Remember: The evaluation of floors, walls and carpentry has already been completed in the general status. Use the notes to highlight specific anomalies.",
          numeroHabitaciones: "Number of bedrooms in the dwelling",
          fotosVideoHabitacion: {
            title: "Photos and video of the bedroom",
            description: "The video should show a complete panoramic view of the bedroom. Prioritize lighting and make sure to include all walls, the window, and the built-in wardrobe (if it exists).",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of the walls, ceilings, floor and baseboards. Look for marks, wear and humidity.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Review the condition and operation of windows, blinds, built-in wardrobes and passage doors.",
            items: {
              ventanas: "Windows",
              persianas: "Blinds",
              armarios: "Wardrobes",
            },
            puertaEntrada: "Entrance door",
          },
          electricidad: {
            title: "Electricity",
            description: "Evaluate lights, switches and power outlets. Check if they work correctly.",
            whatElementsBadCondition: "Which elements are in bad condition?",
            elements: {
              luces: "Lights",
              interruptores: "Switches",
              tomasCorriente: "Power outlets",
              tomaTelevision: "TV outlet",
            },
          },
          climatizacion: {
            title: "Climate Control",
            description: "Indicate if there are radiators or air conditioning units and if they are in good condition.",
            items: {
              radiadores: "Radiators",
              splitAc: "Split A/C Unit",
            },
          },
          mobiliario: {
            title: "Furniture",
            existeMobiliario: "Furniture exists",
            queMobiliarioExiste: "What furniture exists?",
          },
        },
        salon: {
          title: "Living Room",
          description: "Visual documentation of the Living Room. The video should provide a complete view of the main space layout.",
          fotosVideoSalon: {
            title: "Living room photos and video",
            description: "Video showing the flow and layout of the Living Room. The photo should capture the maximum breadth of the space.",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of walls, ceilings, floors, and baseboards. Look for marks, wear, and humidity.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Review the condition and operation of windows, blinds, built-in wardrobes, and passage door.",
            items: {
              ventanas: "Windows",
              persianas: "Blinds",
              armarios: "Wardrobes",
            },
            puertaEntrada: "Entrance door",
          },
          electricidad: {
            title: "Electricity",
            description: "Evaluate lights, switches, and power outlets. Check if they work correctly.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              luces: "Lights",
              interruptores: "Switches",
              tomasCorriente: "Power outlets",
              tomaTelevision: "TV outlet",
            },
          },
          climatizacion: {
            title: "Climate Control",
            description: "Indicate if there are radiators or air conditioning units and if they are in good condition.",
            items: {
              radiadores: "Radiators",
              splitAc: "Split A/C Unit",
            },
          },
          mobiliario: {
            existeMobiliario: "Furniture exists",
            queMobiliarioExiste: "What furniture exists?",
          },
        },
        banos: {
          title: "Bathrooms",
          bathroom: "Bathroom",
          description: "Detailed inspection of wet areas. This evaluation focuses on the condition of plumbing, drainage, and sanitary fixtures. The assessment of each bathroom is independent.",
          fotosVideoBano: {
            title: "Bathroom photos and video",
            description: "Video focused on the condition of sanitary fixtures, faucets, and shower/bathtub. Include a photo of tiles and grout if mold, humidity, or any damage has been detected.",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of walls, ceilings, floors, and baseboards. Look for marks, wear, and humidity.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          aguaDrenaje: {
            title: "Water and drainage",
            description: "Review cold and hot water points, as well as drainage systems.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              puntosAgua: "Cold and hot water points",
              desagues: "Drains",
            },
          },
          sanitarios: {
            title: "Sanitary fixtures",
            description: "Check that the toilet, sink, and shower or bathtub are in good condition, without leaks or damage.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              platoDuchaBanera: "Shower tray / Bathtub",
              inodoro: "Toilet (Viter)",
              lavabo: "Sink (Roca)",
            },
          },
          griferiaDucha: {
            title: "Faucets and shower or bathtub",
            description: "Verify the condition of faucets and shower screen or curtain.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              grifos: "Faucets",
              mamparaCortina: "Shower screen / Curtain",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Review the condition and operation of windows, blinds, built-in wardrobes, and passage door.",
            items: {
              ventanas: "Windows",
              persianas: "Blinds",
            },
            puertaEntrada: "Entrance door",
          },
          mobiliario: {
            title: "Furniture",
            description: "Review the condition of the sink cabinet, mirror, and accessories like the towel rack or toilet paper holder.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              muebleLavabo: "Sink cabinet",
              espejo: "Mirror",
              toalleroPortapapeles: "Towel rack / Toilet paper holder",
            },
          },
          ventilacion: {
            title: "Ventilation",
            description: "Indicate if the bathroom has a window or a forced ventilation system (extraction) and evaluate its condition.",
          },
        },
        cocina: {
          title: "Kitchen",
          description: "Detailed inspection of fixed furniture, water, and appliances. Please ensure maximum precision in the state of the modules and the countertop.",
          fotosVideoCocina: {
            title: "Kitchen photos and video",
            description: "Video showing fixed furniture (modules, countertop) and appliances in context. The photo must capture the general state of the countertop and fronts.",
          },
          acabados: {
            title: "Finishes",
            description: "Evaluate the condition of walls, ceilings, floors, and baseboards. Look for marks, wear, and humidity.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          mobiliarioFijo: {
            title: "Fixed Furniture",
            description: "Review the state of the base and wall units, the countertop, and the plinth. Check that they are well-secured and without visible damage.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              modulosBajos: "Base units",
              modulosAltos: "Wall units",
              encimera: "Countertop",
              zocalo: "Plinth",
            },
          },
          aguaDrenaje: {
            title: "Water and drainage",
            description: "Verify the state of the sink and faucet. Make sure there are no leaks and that the drain works correctly.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              grifo: "Faucet",
              fregadero: "Sink",
              desagues: "Drains",
            },
          },
          carpinteria: {
            title: "Carpentry",
            description: "Review the state and functioning of windows, blinds, built-in wardrobes, and interior doors.",
            items: {
              ventanas: "Windows and sills",
              persianas: "Blinds",
            },
            puertaEntrada: "Entrance door",
          },
          almacenamiento: {
            title: "Storage",
            items: {
              armariosDespensa: "Pantry cupboards",
              cuartoLavado: "Laundry room",
            },
          },
          electrodomesticos: {
            title: "Appliances",
            items: {
              placaGas: "Gas hob",
              placaVitroInduccion: "Ceramic or Induction hob",
              campanaExtractora: "Extractor hood",
              horno: "Oven",
              nevera: "Refrigerator",
              lavadora: "Washing machine",
              lavavajillas: "Dishwasher",
              microondas: "Microwave",
            },
          },
        },
        exteriores: {
          title: "Property Exteriors",
          description: "Evaluate the elements of the property with exterior access (balconies, terraces, clotheslines). Prioritize safety (railings and grilles) and exterior finishes.",
          fotosVideoExterior: {
            title: "Exterior photos and video (terrace, balcony or yard)",
            description: "Document the views, the condition of the pavement and safety (railings, grilles). Indicate if access is enabled and if it applies to the property.",
          },
          seguridad: {
            title: "Security",
            items: {
              barandillas: "Railings",
              rejas: "Grilles",
            },
          },
          sistemas: {
            title: "Systems",
            items: {
              tendederoExterior: "Exterior clothesline",
              toldos: "Awnings",
            },
          },
          acabadosExteriores: {
            title: "Exterior finishes",
            description: "Evaluate the condition of walls, ceilings, floors and baseboards. Check for wear, damage or signs of humidity.",
            whatElementsBadCondition: "What elements are in bad condition?",
            elements: {
              paredes: "Walls",
              techos: "Ceilings",
              suelo: "Floor",
              rodapies: "Baseboards",
            },
          },
          observaciones: {
            title: "Observations",
            description: "Write down the details to be considered by the team of analysts and reformers",
            placeholder: "Write down the details to be considered by the team of analysts and reformers",
          },
        },
      },
    },
  },
};
