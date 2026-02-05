# Vistral Database Schema & UI Mapping

This document maps the UI labels to the exact Supabase database columns.

## 1. Table: `properties`

### 0. System & Lifecycle Fields
*These fields control the card's identity, position in the Kanban, and age.*

| UI Label | Supabase Variable (Exact) | SQL Type | Description |
| :--- | :--- | :--- | :--- |
| System ID | `id` | `uuid` | Primary Key (Supabase default). |
| Creation Date | `created_at` | `timestamptz` | Date the card entered the system. |
| Last Update | `updated_at` | `timestamptz` | Last modification timestamp. |
| Kanban Phase | `current_stage` | `text` | The active column in the Kanban board. |
| Days in Phase | `days_in_stage` | `integer` | Calculated days since entering current phase (controls Urgency Badge). |

### A. Investor / Owner Fields (Datos del Inversor)
| UI Label | Supabase Variable (Exact) | SQL Type |
| :--- | :--- | :--- |
| Nombre del propietario | `client_full_name` | `text` |
| DNI del propietario | `client_identity_doc_number` | `text` |
| DNI (Documento) | `client_identity_doc_url` | `text` |
| Teléfono | `client_phone` | `text` |
| Email | `client_email` | `text` |
| IBAN | `client_iban` | `text` |
| Certificado Titularidad | `client_bank_certificate_url` | `text` |

### B. Property Details (Resumen Propiedad)
| UI Label | Supabase Variable (Exact) | SQL Type |
| :--- | :--- | :--- |
| Dirección | `address` | `text` |
| Ciudad | `city` | `text` |
| Area Cluster | `area_cluster` | `text` |
| Tipo de activo | `property_asset_type` | `text` (Enum) |
| Tamaño (m²) | `square_meters` | `numeric` |
| Habitaciones | `bedrooms` | `integer` |
| Baños | `bathrooms` | `integer` |
| Garaje | `garage` | `text` |
| Piso/Planta | `floor_number` | `integer` |
| ¿Ascensor? | `has_elevator` | `boolean` |
| ¿Terraza? | `has_terrace` | `boolean` |
| Orientación | `orientation` | `text` |
| Año construcción | `construction_year` | `integer` |
| Comunidad al día | `community_fees_paid` | `boolean` |
| Impuestos al día | `taxes_paid` | `boolean` |
| ITV al día | `itv_passed` | `boolean` |
| Unique ID | `property_unique_id` | `text` |
| Administrador | `admin_name` | `text` |
| Localización llaves | `keys_location` | `text` |
| Fase Actual | `current_stage` | `text` |

### C. Documents & Media (URLs)
*Note: These columns store the file path/URL.*

| UI Label | Supabase Variable (Exact) | SQL Type |
| :--- | :--- | :--- |
| Fotos (Galería) | `pics_urls` | `jsonb` (JSON Array of URLs) |
| Docs Reforma | `doc_renovation_files` | `jsonb` (JSON Array of URLs) |
| Cert. Energético | `doc_energy_cert` | `text` |
| Contrato Compraventa | `doc_purchase_contract` | `text` |
| Nota Simple | `doc_land_registry_note` | `text` |
| **Suministros (Electricidad)** | | |
| Contrato | `doc_contract_electricity` | `text` |
| Factura | `doc_bill_electricity` | `text` |
| **Suministros (Agua)** | | |
| Contrato | `doc_contract_water` | `text` |
| Factura | `doc_bill_water` | `text` |
| **Suministros (Gas)** | | |
| Contrato | `doc_contract_gas` | `text` |
| Factura | `doc_bill_gas` | `text` |
| **Suministros (Otros)** | | |
| Contrato | `doc_contract_other` | `text` |
| Factura | `doc_bill_other` | `text` |
| **Seguros** | | |
| Tipo Seguro | `home_insurance_type` | `text` (Enum) |
| Póliza | `home_insurance_policy_url` | `text` |

### D. Rental Management Fields (Gestión de Alquileres)
*Fields related to rental type and property management assignment.*

| UI Label | Supabase Variable (Exact) | SQL Type | Description |
| :--- | :--- | :--- | :--- |
| Tipo de alquiler | `rental_type` | `text` (Enum) | Valores: 'Larga estancia', 'Corta estancia', 'Vacacional' |
| Plan PM | `property_management_plan` | `text` (Enum) | Valores: 'Premium', 'Basic' |
| Property Manager asignado | `property_manager` | `text` | Valor actual: 'JJ' (único valor por ahora) |
| Rentals Analyst | `rentals_analyst` | `text` | Valores: 'Luis Martín', 'Alice Ruggieri' |
| Contrato Plan PM | `property_management_plan_contract_url` | `text` | URL del contrato del plan de gestión |
| ¿Tiene ya inquilino? | `has_existing_tenant` | `boolean` | Indica si la propiedad ya tiene inquilino |
